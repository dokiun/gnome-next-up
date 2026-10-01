import { t } from "./i18n.js";

const MAX_EVENT_SUMMARY_LENGTH = 35;

function trimLongEventName(summary) {
  if (!summary) return "";
  if (summary.length > MAX_EVENT_SUMMARY_LENGTH) {
    return summary.substring(0, MAX_EVENT_SUMMARY_LENGTH) + "...";
  } else {
    return summary;
  }
}

function notFullDayEvent(event) {
  if (!event || !event.date || !event.end) return false;
  return !(
    event.date.getHours() === 0 &&
    event.date.getMinutes() === 0 &&
    event.end.getHours() === 0 &&
    event.end.getMinutes() === 0
  );
}

export function getTodaysEvents(calendarSource) {
  if (!calendarSource) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Get event from today at midnight

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (typeof calendarSource.requestRange === "function") {
    calendarSource.requestRange(today, tomorrow);
  } else if (typeof calendarSource._loadEvents === "function") {
    calendarSource._loadEvents(true);
  }

  const events = typeof calendarSource.getEvents === "function"
    ? calendarSource.getEvents(today, tomorrow)
    : [];

  const todaysEvents = (events || []).filter(notFullDayEvent);

  return todaysEvents;
}

export function getNextEventsToDisplay(todaysEvents) {
  const now = new Date();
  const N = todaysEvents.length;

  let currentEvent = null; // The calendar event the user is currently in
  let nextEvent = null; // The next calendar event coming up
  let done = false;

  for (let i = 0; i < N; i++) {
    if (done) break;

    const event = todaysEvents[i];
    const eventStart = event.date;
    const eventEnd = event.end;

    if (now < eventStart) {
      nextEvent = event;
      break;
    } else if (now < eventEnd) {
      currentEvent = event;

      // Check whether there's an event after this one
      if (i < N - 1) {
        let someNextEvent;

        for (let j = i + 1; j < N; j++) {
          someNextEvent = todaysEvents[j];

          // Check whether the next event overlaps the current event
          // or whether they start at the same time

          if (!(someNextEvent.date.valueOf() === currentEvent.date.valueOf())) {
            nextEvent = someNextEvent;
            done = true;
            break;
          }
        }
      }
    }
  }

  return {
    currentEvent: currentEvent,
    nextEvent: nextEvent,
  };
}

export function eventStatusToIndicatorText(eventStatus, lang = "es") {
  function displayNextEvent(event) {
    const timeText = getTimeOfEventAsText(event.date);
    const diffText = getTimeToEventAsText(event.date, lang);
    const summary = trimLongEventName(event.summary);

    const inWord = t("inTime", lang);
    const atWord = t("atTime", lang);
    return `${inWord} ${diffText}: ${summary} ${atWord} ${timeText}`;
  }

  function displayCurrentEventAndNextEvent(currentEvent, nextEvent) {
    const endsInText = getTimeToEventAsText(currentEvent.end, lang);
    const timeText = getTimeOfEventAsText(nextEvent.date);
    const summary = trimLongEventName(nextEvent.summary);

    const endsInWord = t("endsIn", lang);
    const nextWord = t("nextEvent", lang);
    const atWord = t("atTime", lang);
    return `${endsInWord} ${endsInText}. ${nextWord}: ${summary} ${atWord} ${timeText}`;
  }

  function displayCurrentEvent(event) {
    const endsInText = getTimeToEventAsText(event.end, lang);
    const summary = trimLongEventName(event.summary);

    const endsInWord = t("endsIn", lang);
    return `${endsInWord} ${endsInText}: ${summary}`;
  }

  function displayNoEvents() {
    return t("doneForToday", lang);
  }

  const { currentEvent, nextEvent } = eventStatus;

  if (currentEvent != null) {
    if (nextEvent != null) {
      return displayCurrentEventAndNextEvent(currentEvent, nextEvent);
    } else {
      return displayCurrentEvent(currentEvent);
    }
  } else {
    if (nextEvent != null) {
      return displayNextEvent(nextEvent);
    } else {
      return displayNoEvents();
    }
  }
}

function getTimeOfEventAsText(eventDate) {
  const hrs = eventDate.getHours();
  let mins = eventDate.getMinutes().toString().padStart(2, "0");

  const time = `${hrs}:${mins}`;
  return time;
}

function getTimeToEventAsText(eventDate, lang = "es") {
  const now = new Date();
  const diff = Math.abs(eventDate - now);
  const diffInMins = Math.ceil(diff / (1000 * 60));

  const hrDiff = Math.floor(diffInMins / 60);
  const minDiff = diffInMins % 60;
  const hrUnit = t("hrShort", lang);
  const minUnit = t("minShort", lang);

  if (hrDiff > 0) {
    return minDiff > 0
      ? `${hrDiff} ${hrUnit} ${minDiff} ${minUnit}`
      : `${hrDiff} ${hrUnit}`;
  }
  return `${minDiff} ${minUnit}`;
}
