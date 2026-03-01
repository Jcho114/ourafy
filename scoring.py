from check import get_bio_snapshot, get_tokens
from concurrent.futures import ThreadPoolExecutor


"""
{'score': 74, 'activity_balance': 68, 'body_temperature': 92, 'hrv_balance': 91, 'recovery_index': 23, 'resting_heart_rate': 100, 'sleep_balance': 73, 'sleep_regularity': 90, 'deep_sleep': 95, 'efficiency': 90, 'latency': 67, 'rem_sleep': 47, 'restfulness': 86, 'timing': 100, 'total_sleep': 59, 'day_summary': 'stressful', 'stress_high': 12600}
"""

# min and max values of oura scores are from 0-100
def normalize(value, min_val=0, max_val=100):
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))

# a weighted recovery-performance model designed to estimate the user's total mental bandwidth

FOCUS_WEIGHTS = {
    "w1": 0.30, 
    "w2": 0.25,     
    "w3": 0.20,
    "w4": 0.15,        
    "w5": 0.10     
}

def calc_focus_capacity(metrics: dict) -> float:
    f_score = FOCUS_WEIGHTS['w1'] * metrics['score'] + FOCUS_WEIGHTS['w2'] * metrics['hrv_balance'] + FOCUS_WEIGHTS['w3'] * metrics['sleep_balance'] + FOCUS_WEIGHTS['w4'] * metrics['efficiency'] + FOCUS_WEIGHTS['w5'] * metrics['recovery_index']
    
    return round(f_score / 100, 2)

# estimates cognitive clarity potential based on restorative sleep stages
NEUROCOGNITIVE_READINESS_WEIGHTS = {
    "o1": 0.45,
    "o2": 0.20,
    "o3": 0.20,
    "o4": 0.15,
}
def calc_neurocognitive_red(metrics: dict) -> float:
    nr_score = NEUROCOGNITIVE_READINESS_WEIGHTS['o1'] * metrics['hrv_balance'] + NEUROCOGNITIVE_READINESS_WEIGHTS['o2'] * metrics['deep_sleep'] + NEUROCOGNITIVE_READINESS_WEIGHTS['o3'] * metrics['rem_sleep'] + NEUROCOGNITIVE_READINESS_WEIGHTS['o4'] * 50
    return round(nr_score / 100, 2)

# Estimates the dominance of the sympathetic vs. parasympathetic nervous system
def calc_autonomic_bal(metrics: dict) -> float:
    abr_score = metrics['hrv_balance'] / metrics['resting_heart_rate']
    return abr_score

# the core activation metric. this value determines if the environment triggers a "deep work" state.
LOCKIN_WEIGHTS = {
    "k": 0.3
}
def calc_lock_in(metrics: dict) -> float:

    if metrics['day_summary'] == 'stressful':
        stress_high = 75
    if metrics['day_summary'] == 'engaged':
        stress_high = 50
    if metrics['day_summary'] == 'relaxed':
        stress_high = 25
    else:
        stress_high = 0

    avg_recovery = (metrics['score'] + metrics['hrv_balance'] + metrics['sleep_balance'] + metrics['deep_sleep']) / 4

    li_score = avg_recovery - (LOCKIN_WEIGHTS['k']) * stress_high

    return round(li_score / 100, 2)

def compute_all_metrics(metrics):
    with ThreadPoolExecutor() as executor:
        future_focus = executor.submit(calc_focus_capacity, metrics)
        future_neuro = executor.submit(calc_neurocognitive_red, metrics)
        future_abr = executor.submit(calc_autonomic_bal, metrics)
        future_lockin = executor.submit(calc_lock_in, metrics)

        focus_score = future_focus.result()
        neuro_score = future_neuro.result()
        abr_score = future_abr.result()
        lockin_score = future_lockin.result()

    # print(f"composite focus capacity score: {focus_score}")
    # print(f"neurocognitive readiness model score: {neuro_score}")
    # print(f"autonomic balance ratio score: {abr_score}")
    # print(f"lock in score: {lockin_score}")

    return {"cfc": focus_score, "nrm": neuro_score, "abr": abr_score, "lir": lockin_score}


def main():
    tokens = get_tokens()
    metrics = get_bio_snapshot(**tokens)
    compute_all_metrics(metrics)

if __name__ == "__main__":
    main()