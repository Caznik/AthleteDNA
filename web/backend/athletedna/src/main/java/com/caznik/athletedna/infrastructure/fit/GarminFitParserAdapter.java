package com.caznik.athletedna.infrastructure.fit;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.caznik.athletedna.application.fit.FitParseException;
import com.caznik.athletedna.domain.model.Activity;
import com.caznik.athletedna.domain.model.ActivityLap;
import com.caznik.athletedna.domain.port.FitActivityParser;
import com.garmin.fit.Decode;
import com.garmin.fit.DateTime;
import com.garmin.fit.FitRuntimeException;
import com.garmin.fit.LapMesg;
import com.garmin.fit.Manufacturer;
import com.garmin.fit.MesgBroadcaster;
import com.garmin.fit.SessionMesg;
import com.garmin.fit.Sport;
import com.garmin.fit.SubSport;

// Garmin FIT SDK adapter. Wires Decode + MesgBroadcaster listeners for FileId
// (manufacturer/product), Session (summary) and Lap (per-lap) messages and maps them
// onto the domain Activity. SDK getters already apply FIT scale/offset, so values are
// stored as-is (verified against the AC-2/AC-3 reference numbers). Raw sport strings
// are lower-cased because Sport.getStringFromValue returns the upper-case enum name.
@Component
public class GarminFitParserAdapter implements FitActivityParser {

	@Override
	public Activity parse(byte[] bytes) throws FitParseException {
		if (bytes == null || bytes.length == 0) {
			throw new FitParseException("Empty file");
		}

		Decode decode = new Decode();
		if (!decode.checkFileIntegrity(new ByteArrayInputStream(bytes))) {
			throw new FitParseException("Not a valid FIT file (integrity check failed)");
		}

		List<SessionMesg> sessions = new ArrayList<>();
		List<LapMesg> laps = new ArrayList<>();
		String[] manufacturer = {null};
		String[] productName = {null};

		MesgBroadcaster broadcaster = new MesgBroadcaster(decode);
		broadcaster.addListener((com.garmin.fit.FileIdMesgListener) mesg -> {
			if (mesg.getManufacturer() != null) {
				manufacturer[0] = Manufacturer.getStringFromValue(mesg.getManufacturer());
			}
			if (mesg.getProductName() != null) {
				productName[0] = mesg.getProductName();
			}
		});
		broadcaster.addListener((com.garmin.fit.SessionMesgListener) sessions::add);
		broadcaster.addListener((com.garmin.fit.LapMesgListener) laps::add);

		try {
			broadcaster.run(new ByteArrayInputStream(bytes));
		} catch (FitRuntimeException ex) {
			throw new FitParseException("Failed to decode FIT file: " + ex.getMessage(), ex);
		}

		if (sessions.isEmpty()) {
			throw new FitParseException("FIT file has no session message");
		}

		SessionMesg session = sessions.get(0);
		Activity activity = toActivity(session, manufacturer[0], productName[0]);
		activity.setLaps(toLaps(laps));
		return activity;
	}

	private Activity toActivity(SessionMesg s, String manufacturer, String productName) {
		// Base Activity fields keep the existing pipeline working: trainingLoad stays
		// duration(total_timer_time) x avgHr (AC-12). type is set later by the service.
		Activity a = new Activity(
			null,
			null,
			toDouble(s.getTotalDistance()),
			toSeconds(s.getTotalTimerTime()),
			toInt(s.getAvgHeartRate()),
			null,
			toInstant(s.getStartTime())
		);
		a.setSport(lower(s.getSport()));
		a.setSubSport(lowerSub(s.getSubSport()));
		a.setTotalElapsedTime(toDouble(s.getTotalElapsedTime()));
		a.setTotalTimerTime(toDouble(s.getTotalTimerTime()));
		a.setTotalCalories(s.getTotalCalories());
		a.setMaxHeartRate(toInt(s.getMaxHeartRate()));
		a.setMinHeartRate(toInt(s.getMinHeartRate()));
		a.setAvgPower(s.getAvgPower());
		a.setMaxPower(s.getMaxPower());
		a.setNormalizedPower(s.getNormalizedPower());
		a.setTotalWork(s.getTotalWork());
		a.setAvgCadence(toInt(s.getAvgCadence()));
		a.setMaxCadence(toInt(s.getMaxCadence()));
		a.setAvgStepLength(toDouble(s.getAvgStepLength()));
		a.setTotalAscent(s.getTotalAscent());
		a.setTotalDescent(s.getTotalDescent());
		a.setAvgTemperature(toInt(s.getAvgTemperature()));
		a.setAvgSpeed(toDouble(s.getAvgSpeed()));
		a.setMaxSpeed(toDouble(s.getMaxSpeed()));
		a.setAvgStanceTime(toDouble(s.getAvgStanceTime()));
		a.setAvgVerticalOscillation(toDouble(s.getAvgVerticalOscillation()));
		a.setAvgVerticalRatio(toDouble(s.getAvgVerticalRatio()));
		a.setManufacturer(manufacturer);
		a.setProductName(productName);
		return a;
	}

	private List<ActivityLap> toLaps(List<LapMesg> lapMesgs) {
		List<ActivityLap> result = new ArrayList<>();
		for (LapMesg l : lapMesgs) {
			ActivityLap lap = new ActivityLap();
			lap.setMessageIndex(l.getMessageIndex());
			lap.setStartTime(toInstant(l.getStartTime()));
			lap.setTimestamp(toInstant(l.getTimestamp()));
			lap.setTotalTimerTime(toDouble(l.getTotalTimerTime()));
			lap.setTotalElapsedTime(toDouble(l.getTotalElapsedTime()));
			lap.setTotalDistance(toDouble(l.getTotalDistance()));
			lap.setTotalCalories(l.getTotalCalories());
			lap.setAvgHeartRate(toInt(l.getAvgHeartRate()));
			lap.setMaxHeartRate(toInt(l.getMaxHeartRate()));
			lap.setMinHeartRate(toInt(l.getMinHeartRate()));
			lap.setAvgCadence(toInt(l.getAvgCadence()));
			lap.setMaxCadence(toInt(l.getMaxCadence()));
			lap.setAvgSpeed(toDouble(l.getAvgSpeed()));
			lap.setMaxSpeed(toDouble(l.getMaxSpeed()));
			lap.setAvgPower(l.getAvgPower());
			lap.setTotalAscent(l.getTotalAscent());
			lap.setTotalDescent(l.getTotalDescent());
			lap.setAvgTemperature(toInt(l.getAvgTemperature()));
			result.add(lap);
		}
		// Ordered by messageIndex so persistence + reads are deterministic (AC-3). Laps
		// with a null index sort last rather than NPE-ing.
		result.sort(Comparator.comparing(ActivityLap::getMessageIndex,
			Comparator.nullsLast(Comparator.naturalOrder())));
		return result;
	}

	private static String lower(Sport sport) {
		return sport == null ? null : Sport.getStringFromValue(sport).toLowerCase();
	}

	private static String lowerSub(SubSport subSport) {
		return subSport == null ? null : SubSport.getStringFromValue(subSport).toLowerCase();
	}

	private static Instant toInstant(DateTime dateTime) {
		return dateTime == null ? null : dateTime.getDate().toInstant();
	}

	private static Double toDouble(Float value) {
		return value == null ? null : value.doubleValue();
	}

	private static Integer toInt(Short value) {
		return value == null ? null : value.intValue();
	}

	private static Integer toInt(Byte value) {
		return value == null ? null : value.intValue();
	}

	private static Long toSeconds(Float seconds) {
		return seconds == null ? null : Math.round(seconds.doubleValue());
	}
}
