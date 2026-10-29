# TypeRush

TypeRush is a lightweight, browser-based typing speed test. Choose a test length, type the generated prompt, and see your speed and accuracy update as you go. It is built with plain HTML, CSS, and JavaScript, with no dependencies or build step.

## Features

- Four test durations: 15, 30, 60, and 120 seconds
- A randomly generated typing prompt for each test
- Live words-per-minute, accuracy, time-remaining, and character counts
- Correct and incorrect characters highlighted as you type
- A caret and on-screen keyboard that responds to key presses
- Backspace support for correcting mistakes
- A results screen when the timer runs out or the prompt is complete
- Restart and retry controls, plus a `Tab` + `Enter` keyboard shortcut
- Responsive layout, with the on-screen keyboard hidden on smaller screens
- No dependencies, accounts, or build tools required

## Getting started

### Open the app directly

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.
3. Choose a duration and start typing.

### Serve it locally

You can also serve the project with Python's built-in HTTP server:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser. Stop the server with `Ctrl+C`.

## How to use

1. Select a test duration: **15s**, **30s**, **60s**, or **120s**.
2. Click the typing area, or press a printable key, to focus the test.
3. Type the displayed prompt. The timer begins with your first character.
4. Use **Backspace** to correct characters.
5. Review your results when the timer expires or you finish the prompt.
6. Select **Restart** or **Try Again** to generate a new prompt.

You can also press `Tab` followed by `Enter` to restart the test.

## Scoring

- **WPM:** Correct characters are divided by five, then divided by elapsed minutes. The displayed value is rounded to the nearest whole number.
- **Accuracy:** Correct keystrokes divided by total keystrokes, shown as a rounded percentage. Corrections count as additional keystrokes.
- **Correct / errors:** The number of currently correct and incorrect prompt characters. These counts update when you use Backspace.

## Project structure

```text
.
├── index.html   # App markup and typing-test interface
├── script.js    # Prompt generation, input handling, timer, and scoring
├── style.css    # Layout, colors, keyboard, and responsive styles
└── README.md    # Project documentation
```

## Customization

- **Test durations:** Update the duration buttons in `index.html` and the matching `WORDS_FOR_DURATION` values in `script.js`.
- **Prompt vocabulary:** Edit `WORD_POOL` in `script.js`.
- **Appearance and responsive behavior:** Adjust the styles and media queries in `style.css`.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript

## License

No license is currently specified for this project.
