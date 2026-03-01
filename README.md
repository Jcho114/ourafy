**The Problem**
As students, we try to force productivity without considering our biological state and health. There are days that we grind textbooks and code while we should be revovering. Other days we waste peak cognitive performance by not LOCKING IN.

**The Solution**
Essentially, the main purpose of Ourafy is to help you LOCK IN. Using the Oura Ring API, Ourafy fetches your bio snapshot which can include readiness score, hrv_balance, resting heart rate, sleep balance, sleep regularity, stress level, and much more. Based on these metrics, we were also able to create some formulas to determine the mode of your GRIND session:

**Composite Focus Capacity Score ($F$)**
A weighted recovery-performance model designed to estimate the user's total mental bandwidth.

$$F = w_1(\text{score}) + w_2(\text{hrv\_balance}) + w_3(\text{sleep\_balance}) + w_4(\text{efficiency}) + w_5(\text{recovery\_index})$$

---

**Neurocognitive Readiness Model ($NR$)**
Estimates cognitive clarity potential based on restorative sleep stages.

$$NR = \theta_1(\text{hrv\_balance}) + \theta_2(\text{deep\_sleep}) + \theta_3(\text{rem\_sleep}) - \theta_4(\text{stress\_high})$$

---

**Autonomic Balance Ratio ($ABR$)**
Estimates the dominance of the sympathetic vs. parasympathetic nervous system.

$$ABR = \frac{\text{hrv\_balance}}{\text{resting\_heart\_rate}}$$

---

**Lock-In Readiness Function ($LI$)**
**The Core Activation Metric.** This value determines if the environment triggers a "Deep Work" state.

$$LI = \frac{\text{score} + \text{hrv\_balance} + \text{sleep\_balance} + \text{deep\_sleep}}{4} - k(\text{stress\_high})$$


We customized the weights of these formulas to represent if certain scores should be considered heavier than others.

**Leveraging AI**
In addition, we used OPENAI's `gpt-4o-mini` model to transform biometric data into an adaptive deep work protocol (pomodoro session), ensuring the user's productivity system aligns with their biological capacity. 

That said
