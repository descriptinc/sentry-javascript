interface CrontabSchedule {
  type: 'crontab';
  // The crontab schedule string, e.g. 0 * * * *.
  value: string;
}

interface IntervalSchedule {
  type: 'interval';
  value: number;
  unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';
}

type MonitorSchedule = CrontabSchedule | IntervalSchedule;

// https://develop.sentry.dev/sdk/check-ins/
export interface CheckIn {
  // Check-In ID (unique and client generated).
  check_in_id: string;
  // The distinct slug of the monitor.
  monitor_slug: string;
  // The status of the check-in.
  status: 'in_progress' | 'ok' | 'error';
  // The duration of the check-in in seconds. Will only take effect if the status is ok or error.
  duration?: number;
  release?: string;
  environment?: string;
  monitor_config?: {
    schedule: MonitorSchedule;
    // The allowed allowed margin of minutes after the expected check-in time that
    // the monitor will not be considered missed for.
    checkin_margin?: number;
    // The allowed allowed duration in minutes that the monitor may be `in_progress`
    // for before being considered failed due to timeout.
    max_runtime?: number;
    // A tz database string representing the timezone which the monitor's execution schedule is in.
    // See: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    timezone?: string;
  };
}
