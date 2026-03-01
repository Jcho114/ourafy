# 🧠 Ourafy: Biometric Logic & Focus Models

This document outlines the mathematical models used by Ourafy to translate raw Oura Ring API data into actionable focus configurations.

---

## 1. Composite Focus Capacity Score ($F$)
A weighted recovery-performance model designed to estimate the user's total mental bandwidth.

$$F = w_1(\text{score}) + w_2(\text{hrv\_balance}) + w_3(\text{sleep\_balance}) + w_4(\text{efficiency}) + w_5(\text{recovery\_index})$$

**Standard Weighting:**
* $w_1 (0.30)$: Overall Readiness
* $w_2 (0.25)$: HRV Balance
* $w_3 (0.20)$: Sleep Balance
* $w_4 (0.15)$: Efficiency
* $w_5 (0.10)$: Recovery Index

---

## 2. Neurocognitive Readiness Model ($NR$)
Estimates cognitive clarity potential based on restorative sleep stages.

$$NR = \theta_1(\text{hrv\_balance}) + \theta_2(\text{deep\_sleep}) + \theta_3(\text{rem\_sleep}) - \theta_4(\text{stress\_high})$$

---

## 3. Autonomic Balance Ratio ($ABR$)
Estimates the dominance of the sympathetic vs. parasympathetic nervous system.

$$ABR = \frac{\text{hrv\_balance}}{\text{resting\_heart\_rate}}$$

---

## 4. Lock-In Readiness Function ($LI$)
**The Core Activation Metric.** This value determines if the environment triggers a "Deep Work" state.

$$LI = \frac{\text{score} + \text{hrv\_balance} + \text{sleep\_balance} + \text{deep\_sleep}}{4} - k(\text{stress\_high})$$
