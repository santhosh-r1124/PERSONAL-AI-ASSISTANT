import pathlib
from datetime import datetime

import pandas as pd

BASE_DIR = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
OUT_DIR = DATA_DIR / "processed"
OUT_DIR.mkdir(exist_ok=True, parents=True)


def parse_ts(x: str):
    if not x or pd.isna(x):
        return None
    return datetime.fromisoformat(x.replace("Z", "+00:00"))


def preprocess_google_calendar():
    src = DATA_DIR / "google_calendar_sample.csv"
    df = pd.read_csv(src)
    for col in [
        "start_datetime_utc",
        "end_datetime_utc",
        "created_at_utc",
        "updated_at_utc",
    ]:
        df[col] = df[col].apply(parse_ts)

    df["duration_minutes"] = (
        (df["end_datetime_utc"] - df["start_datetime_utc"]).dt.total_seconds() / 60
    )
    df["day_of_week"] = df["start_datetime_utc"].dt.dayofweek
    df["hour_of_day"] = df["start_datetime_utc"].dt.hour

    df.to_parquet(OUT_DIR / "google_calendar_events.parquet", index=False)


def preprocess_todoist():
    src = DATA_DIR / "todoist_tasks_sample.csv"
    df = pd.read_csv(src)
    for col in ["due_datetime_utc", "created_at_utc", "completed_at_utc"]:
        df[col] = df[col].apply(parse_ts)

    df["is_completed"] = df["completed_at_utc"].notna()
    df["labels_list"] = df["labels"].astype(str).str.split(";")

    df.to_parquet(OUT_DIR / "todoist_tasks.parquet", index=False)


def preprocess_kaggle_productivity():
    src = DATA_DIR / "kaggle_productivity_sample.csv"
    df = pd.read_csv(src, parse_dates=["date"])
    df["late_task_ratio"] = df["late_tasks_count"] / df["total_tasks_completed"].clip(
        lower=1
    )
    df.to_parquet(OUT_DIR / "productivity_daily.parquet", index=False)


def preprocess_synthetic_logs():
    src = DATA_DIR / "synthetic_task_logs.csv"
    df = pd.read_csv(src)
    df["event_timestamp_utc"] = df["event_timestamp_utc"].apply(parse_ts)
    df.to_parquet(OUT_DIR / "task_logs.parquet", index=False)


def main():
    preprocess_google_calendar()
    preprocess_todoist()
    preprocess_kaggle_productivity()
    preprocess_synthetic_logs()
    print(f"Processed datasets written to {OUT_DIR}")


if __name__ == "__main__":
    main()


