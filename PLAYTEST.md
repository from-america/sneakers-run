# Human playtest checklist

Run `npm test` before collecting feel feedback. Automated route checks use the shipping simulation with damage enabled; they are not human playtests.

Play the first, fifth and final blocks at standard pace, then one relaxed block and a five-minute endless run. Repeat on keyboard, a physical controller and a phone. Record device, viewport, input, pace and exact obstacle/time for problems. Rate each statement from 1 (strongly disagree) to 5 (strongly agree):

| Statement | Rating | Specific evidence |
| --- | --- | --- |
| I could read the obstacle and intended move before reaching it. | | |
| Jump and roll happened when I pressed, including a quick tap. | | |
| The visible body explained every collision. | | |
| Double jump, air drop and landing felt predictable. | | |
| Hit recovery gave me time to regain control. | | |
| Coins helped me read useful routes without unavoidable hits. | | |
| Pause, resume, retry and settings worked smoothly. | | |
| Text and actions stayed legible and reachable. | | |
| Difficulty progressed without feeling arbitrary. | | |
| I wanted to replay for a better result. | | |

Repeated scores below 4 are a tuning signal. Fix the specific problem, rerun relevant tests, inspect affected screenshots and explicitly renew the content-bound review. Do not label the whole game perfect from one run.

Before public desktop release, test physical Steam Input, unplug/reconnect, Deck suspend/resume, fullscreen, different audio devices, locked-down save directories, Windows/Linux launch and extended low-end hardware sessions.
