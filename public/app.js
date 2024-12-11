const typingText = document.querySelector(".typing-text");
const result = document.querySelector(".result");
const wpmDisplay = document.querySelector("#wpm");
const accuracyDisplay = document.querySelector("#accuracy");
const loading = document.querySelector(".loading");

let caretPositionLeft = 0;
let caret;
let caretTimeout;

async function getPassage() {
	// TEST const passage = data.quotes[2574];
	let passage;
	
	try {
		loading.classList.add("loading");
		passage = (await axios.get("http://localhost:3000/data")).data;
	} catch (error) {
		console.error(error);
		passage = {
			text: "The quick brown fox jumps over the lazy dog",
			length: 43,
		};
	} finally {
		loading.classList.remove("loading");
	}

	return passage;
}

function moveCaretHorizontal(dir) {
	caretPositionLeft += dir;
	if (Math.abs(dir) > 1) {
		caret.classList.remove("transition-slow");
	}
	caret.style.left = `calc(${caretPositionLeft}*19.22px)`;
	caret.classList.add("transition-slow");
}

function createLetter(letter) {
	let letterDOM = document.createElement("letter");
	letterDOM.textContent = letter;

	return letterDOM;
}

function createWord(word) {
	const wordDOM = document.createElement("div");
	wordDOM.classList.add("word");

	for (let letter of word) {
		let letterDOM = createLetter(letter);
		wordDOM.appendChild(letterDOM);
	}

	return wordDOM;
}

function moveCaretToWord(word) {
	caretPositionLeft = 0;
	moveCaretHorizontal(0);
	word.insertBefore(caret, word.children[0]);
}

async function addTextToDOM() {
	const passage = await getPassage();
	let wordsText = passage.text.split(" ");
	const words = [];
	for (let ele of wordsText) {
		words.push({ word: ele, incorrectLetterIndex: -1, typedTill: 0 });
	}

	for (let i = 0; i < words.length; i++) {
		let word = createWord(wordsText[i]);
		typingText.appendChild(word);
	}

	return {
		words: words,
		length: passage.length,
	};
}

async function listen() {
	let currWord = 0,
		correctTypedCount = 0,
		currLine = 0,
		currLetter = 0,
		incorrectTypedCount = 0,
		seconds = 0,
		resizeTimeout,
		timeInterval,
		totalChars;

	let hasStarted = false;
	let isListening = false;
	let isRequestInProgress = false;

	let wordsDOM;
	let words;
	let lines;

	function initializeCaret() {
		caret = document.createElement("div");
		caret.id = "caret";
		caret.classList.add("animation-caret-flash");
		caret.classList.add("transition-slow");
		moveCaretToWord(typingText.firstElementChild);
	}

	async function reset() {
		typingText.innerHTML = "";
		isRequestInProgress = true;
		const passageData = await addTextToDOM();
		isRequestInProgress = false;
		words = passageData.words;
		totalChars = passageData.length;

		typingText.classList.remove("hidden");
		result.classList.add("hidden");

		wordsDOM = Array.from(document.querySelectorAll(".word"));
		wordsDOM[0].classList.add("active-word");

		lines = (await getLine()).lines;

		caret?.remove();
		initializeCaret();

		clearInterval(timeInterval);

		isListening = true;
		hasStarted = false;

		seconds = 0;
		currLine = 0;
		currWord = 0;
		currLetter = 0;
		correctTypedCount = 0;
		incorrectTypedCount = 0;
	}

	function removeLine(line) {
		wordsDOM.reverse();
		words.reverse();

		for (let i = 0; i < lines[line].length; i++) {
			wordsDOM.pop();
			words.pop();
			lines[line][i].remove();
			currWord--;
		}
		wordsDOM.reverse();
		words.reverse();
		lines.shift();
	}

	async function getLine(start = 0, word) {
		const typingTextWidth = parseFloat(
			window.getComputedStyle(typingText).width.slice(0, -2)
		);
		const lines = [[]];
		let currWidth = 0;
		let wordWidth;
		let wordLine = 0;
		let hasFoundWord = false;

		for (let i = start; i < wordsDOM.length; i++) {
			const item = wordsDOM[i];

			wordWidth = parseFloat(
				window.getComputedStyle(item).width.slice(0, -2)
			);

			if (currWidth + wordWidth > typingTextWidth) {
				currWidth = 0;
				lines.push([]);
			}

			// For setting correct line number if the readjustment does not remove all the typed words
			if (!hasFoundWord && words[i] === word) {
				hasFoundWord = true;
				wordLine = lines.length - 1;
			}

			currWidth += wordWidth + 19;
			lines[lines.length - 1].push(item);
		}
		return { lines: lines, wordLine: wordLine };
	}

	function startTimeCounting() {
		timeInterval = setInterval(() => {
			seconds += 0.5;
		}, 500);
	}

	function backspace(letters) {
		if (currLetter > 0) {
			moveCaretHorizontal(-1);
			currLetter--;

			if (letters[currLetter]?.classList.contains("correct-letter")) {
				correctTypedCount--;
				letters[currLetter].classList.remove("correct-letter");
			}

			if (currLetter == words[currWord].incorrectLetterIndex) {
				wordsDOM[currWord].classList.remove("incorrect-word");
				words[currWord].incorrectLetterIndex = -1;
			}

			if (words[currWord].typedTill - words[currWord].word.length > 0) {
				wordsDOM[currWord].removeChild(wordsDOM[currWord].lastChild);
			} else {
				letters[currLetter].classList.remove("incorrect-letter");
			}
			words[currWord].typedTill--;
		} else if (
			currWord != 0 &&
			wordsDOM[currWord - 1].classList.contains("incorrect-word")
		) {
			--correctTypedCount; // For space being correct
			wordsDOM[currWord].classList.remove("active-word");
			moveCaretToWord(wordsDOM[--currWord]);
			wordsDOM[currWord].classList.add("active-word");

			caretPositionLeft = 0;
			moveCaretHorizontal(words[currWord].typedTill);
			currLetter = words[currWord].typedTill;

			if (words[currWord].incorrectLetterIndex == -1) {
				wordsDOM[currWord].classList.remove("incorrect-word");
			}
		}
	}

	function space(letters) {
		moveCaretToWord(wordsDOM[currWord + 1]);

		if (
			lines[currLine + 1] &&
			wordsDOM[currWord + 1] == lines[currLine + 1][0]
		) {
			++currLine;
		}

		if (currLine >= 2 && currLine + 1 < lines.length) {
			removeLine(currLine - 2);
			currLine = 1;
		}

		if (
			currLetter < words[currWord].word.length ||
			words[currWord].incorrectLetterIndex != -1
		) {
			wordsDOM[currWord].classList.add("incorrect-word");
		}

		wordsDOM[currWord].classList.remove("active-word");
		wordsDOM[++currWord].classList.add("active-word");

		currLetter = 0;
	}

	function correctTyped(letters) {
		moveCaretHorizontal(1);
		words[currWord].typedTill++;
		letters[currLetter++].classList.add("correct-letter");
	}

	function extraLetterTyped(letters, extraLetter) {
		words[currWord].typedTill++;
		moveCaretHorizontal(1);
		if (words[currWord].incorrectLetterIndex == -1) {
			wordsDOM[currWord].classList.add("incorrect-word");
			words[currWord].incorrectLetterIndex = currLetter;
		}

		let extraLetterDOM = createLetter(extraLetter);
		extraLetterDOM.classList.add("extra-letter");
		extraLetterDOM.classList.add("incorrect-letter");
		wordsDOM[currWord].appendChild(extraLetterDOM);
		currLetter++;
	}

	function incorrectTyped(letters) {
		words[currWord].typedTill++;
		moveCaretHorizontal(1);
		if (words[currWord].incorrectLetterIndex == -1) {
			wordsDOM[currWord].classList.add("incorrect-word");
			words[currWord].incorrectLetterIndex = currLetter;
		}
		console.log(letters[currLetter]);
		letters[currLetter++].classList.add("incorrect-letter");
	}

	function controlBackspace() {
		if (currLetter == 0 && currWord > 0) {
			backspace();
		}

		let i = currLetter;

		while (
			i >= 0 &&
			wordsDOM[currWord].children[i].classList.contains("extra-letter")
		) {
			wordsDOM[currWord].removeChild(wordsDOM[currWord].lastElementChild);
			i--;
		}

		for (; i >= 0; i--) {
			if (
				wordsDOM[currWord].children[i].classList.contains(
					"correct-letter"
				)
			) {
				--correctTypedCount;
				wordsDOM[currWord].children[i].classList.remove(
					"correct-letter"
				);
			}

			wordsDOM[currWord].children[i].classList.remove("incorrect-letter");
		}

		wordsDOM[currWord].classList.remove("incorrect-word");
		words[currWord].incorrectLetterIndex = -1;
		words[currWord].typedTill = 0;
		moveCaretToWord(wordsDOM[currWord]);
		currLetter = 0;
	}

	function showResult() {
		typingText.classList.add("hidden");
		result.classList.remove("hidden");
		wpmDisplay.textContent =
			"WPM : " +
			Math.round((correctTypedCount / 5 / (seconds / 60)) * 100) / 100;
		console.log("totalCharsTyped :>> ", correctTypedCount);
		console.log("totalChars :>> ", totalChars);
		accuracyDisplay.textContent =
			"Accuracy : " +
			Math.round(
				((100 * (totalChars - incorrectTypedCount)) / totalChars) * 100
			) /
				100 +
			"%";
		hasStarted = false;
		isListening = false;
	}

	async function typingHandler(event) {
		if (event.key == "Enter" && !isRequestInProgress && !event.repeat) {
			await reset();
		}

		if (!isListening) return;

		let letters = [].slice.call(wordsDOM[currWord].children, 1);

		if (event.key == "Backspace" && event.ctrlKey) {
			controlBackspace();
			return;
		}

		caret.classList.remove("animation-caret-flash");
		clearTimeout(caretTimeout);
		caretTimeout = setTimeout(() => {
			caret.classList.add("animation-caret-flash");
		}, 3000);

		if (event.key == "Backspace") {
			backspace(letters);
			return;
		}

		if (event.key.length > 1) return;

		if (event.key == " ") {
			event.preventDefault();
			if (currLetter == 0) return;

			correctTypedCount++;
			if (currWord == words.length - 1) {
				showResult();
			} else {
				space(letters);
			}
		} else if (words[currWord].word[currLetter] == event.key) {
			correctTypedCount++;
			if (
				currWord == words.length - 1 &&
				currLetter == words[currWord].word.length - 1
			) {
				showResult();
			} else {
				if (!hasStarted) {
					startTimeCounting();
					hasStarted = true;
				}
				correctTyped(letters);
			}
		} else if (currLetter >= words[currWord].word.length) {
			incorrectTypedCount++;
			if (words[currWord].typedTill - words[currWord].word.length > 5)
				return;
			extraLetterTyped(letters, event.key);
		} else {
			incorrectTypedCount++;
			if (!hasStarted) {
				startTimeCounting();
				hasStarted = true;
			}
			incorrectTyped(letters);
		}
	}

	await reset();

	document.addEventListener("keydown", typingHandler);

	window.addEventListener("resize", () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(async () => {
			let len = wordsDOM.length;
			const linesData = await getLine(0, words[currWord]);
			lines = linesData.lines;

			if (lines.length <= 3) {
				currLine = linesData.wordLine;
				return;
			}

			wordsDOM.reverse();
			words.reverse();
			for (let i = 0; i < currWord; i++) {
				wordsDOM[len - i - 1].remove();
				wordsDOM.pop();
				words.pop();
			}
			wordsDOM.reverse();
			words.reverse();

			lines = (await getLine()).lines;
			currLine = 0;
			currWord = 0;
		}, 200);
	});
}

async function main() {
	await listen();
}

main();
