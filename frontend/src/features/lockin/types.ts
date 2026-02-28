export type LockinOption = {
  id: string;
  apps_to_open: string[];
  pomodoro: {
    minutes_on: number;
    minutes_off: number;
    cycles: number;
  };
  reason: string;
};

export type LockinOptionsResponse = {
  data: LockinOption[];
};
