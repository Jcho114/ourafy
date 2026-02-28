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

## 2. Cognitive Strain Index ($CS$)
An inverse load model where a higher value indicates significant physiological strain.

$$CS = \alpha_1(100 - \text{hrv\_balance}) + \alpha_2(\text{resting\_heart\_rate}) + \alpha_3(\text{stress\_high}) + \alpha_4(100 - \text{total\_sleep})$$

---

## 3. Sleep Architecture Quality Score ($SAQ$)
Evaluates the internal structure of sleep rather than just total duration.

$$SAQ = \beta_1(\text{deep\_sleep}) + \beta_2(\text{rem\_sleep}) + \beta_3(\text{efficiency}) + \beta_4(\text{restfulness})$$

---

## 4. Circadian Stability Index ($CSI$)
Measures how well the user is aligned with their natural biological clock.

$$CSI = \gamma_1(\text{sleep\_regularity}) + \gamma_2(\text{timing}) - \gamma_3(\text{latency})$$

---

## 5. Recovery Deviation Function ($RD$)
Detects mismatches between autonomic recovery and subjective readiness.

$$RD = (\text{score} - \text{sleep\_balance}) + (\text{hrv\_balance} - \text{resting\_heart\_rate})$$

---

## 6. Thermal Stress Load ($TSL$)
Elevated body temperature combined with high stress points toward potential illness or overtraining.

$$TSL = \delta_1(\text{body\_temperature}) + \delta_2(\text{stress\_high})$$

---

## 7. Neurocognitive Readiness Model ($NR$)
Estimates cognitive clarity potential based on restorative sleep stages.

$$NR = \theta_1(\text{hrv\_balance}) + \theta_2(\text{deep\_sleep}) + \theta_3(\text{rem\_sleep}) - \theta_4(\text{stress\_high})$$

---

## 8. Biological Momentum Function ($BM$)
Measures the forward-looking performance potential based on recent activity and rest.

$$BM = \lambda_1(\text{score}) + \lambda_2(\text{activity\_balance}) + \lambda_3(\text{sleep\_balance})$$

---

## 9. Burnout Risk Estimate ($BR$)
Used as a "Safety Trigger" to force the system into **Recovery Mode**.

$$BR = \eta_1(100 - \text{sleep\_balance}) + \eta_2(100 - \text{hrv\_balance}) + \eta_3(\text{stress\_high})$$

---

## 10. Total System Load ($TSL_{total}$)
The master regulatory variable.

$$TSL_{\text{total}} = \sum_{i=1}^{n} w_i x_i$$

Where $x_i \in \{\text{all physiological keys}\}$.

---

## 11. Efficiency-Adjusted Focus Potential ($EFP$)
Balances recovery with the immediate metabolic cost of stress.

$$EFP = \frac{\text{score} \times \text{efficiency}}{1 + \text{stress\_high}}$$

---

## 12. Autonomic Balance Ratio ($ABR$)
Estimates the dominance of the sympathetic vs. parasympathetic nervous system.

$$ABR = \frac{\text{hrv\_balance}}{\text{resting\_heart\_rate}}$$

---

## 13. Sleep Debt Indicator ($SD$)
A cumulative measure of missing restorative rest.

$$SD = (100 - \text{total\_sleep}) + (100 - \text{deep\_sleep}) + (100 - \text{rem\_sleep})$$

---

## 14. Lock-In Readiness Function ($LI$)
**The Core Activation Metric.** This value determines if the environment triggers a "Deep Work" state.

$$LI = \frac{\text{score} + \text{hrv\_balance} + \text{sleep\_balance} + \text{deep\_sleep}}{4} - k(\text{stress\_high})$$

---

## 15. Physiological Stability Index ($PSI$)
Determines the overall stability of the biological state.

$$PSI = (\text{sleep\_regularity} + \text{timing}) - |\text{body\_temperature}| - \text{latency}$$