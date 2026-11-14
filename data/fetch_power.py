"""Download NASA POWER monthly agro-climate data for a point and save it as JSON + CSV.

Usage:
    python data/fetch_power.py --lat 40.65 --lon 29.27 --name yalova
    python data/fetch_power.py --lat 37.87 --lon 32.48 --name konya --start 2004 --end 2023

No API key needed. Only the Python standard library is used.
Outputs: data/<name>_power.json (raw API response) and data/<name>_monthly.csv
"""
import argparse
import csv
import json
import os
import urllib.request

PARAMS = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,GWETROOT,GWETTOP,FROST_DAYS,EVPTRNS"
URL = ("https://power.larc.nasa.gov/api/temporal/monthly/point"
       "?parameters={p}&community=AG&longitude={lon}&latitude={lat}&start={s}&end={e}&format=JSON")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lon", type=float, required=True)
    ap.add_argument("--name", default="site")
    ap.add_argument("--start", type=int, default=2004)
    ap.add_argument("--end", type=int, default=2023)
    a = ap.parse_args()

    url = URL.format(p=PARAMS, lat=a.lat, lon=a.lon, s=a.start, e=a.end)
    print("Downloading:", url)
    with urllib.request.urlopen(url, timeout=120) as r:
        data = json.load(r)

    out_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(out_dir, f"{a.name}_power.json"), "w", encoding="utf-8") as f:
        json.dump(data, f)

    p = data["properties"]["parameter"]
    keys = sorted(p.keys())
    rows = []
    for ym in sorted(p["T2M"].keys()):
        if not 1 <= int(ym[4:]) <= 12:  # skip the annual "13" entries
            continue
        rows.append([ym[:4], ym[4:]] + [p[k].get(ym) for k in keys])
    with open(os.path.join(out_dir, f"{a.name}_monthly.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "month"] + keys)
        w.writerows(rows)
    print(f"Saved {len(rows)} months to data/{a.name}_monthly.csv")
    print("Note: PRECTOTCORR is mm/day; multiply by days in month for mm/month. -999 = missing.")


if __name__ == "__main__":
    main()
