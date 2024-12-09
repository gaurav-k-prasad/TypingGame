const typingText = document.querySelector(".typing-text");
const result = document.querySelector(".result");
const wpmDisplay = document.querySelector("#wpm");
let caretPositionLeft = 0;
let caret;
let caretTimeout;

async function getPassage() {
	const passage = data.quotes[Math.floor(Math.random() * 6349)];
	return passage;
}

function moveCaretHorizontal(dir) {
	caretPositionLeft += dir;
	caret.style.left = `calc(${caretPositionLeft}*19.22px)`;
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

function moveCaretToNextWord(word) {
	caretPositionLeft = -1;
	moveCaretHorizontal(1);
	word.insertBefore(caret, word.children[0]);
}

async function addTextToDOM() {
	const passage = await getPassage();
	const words = passage.text.split(" ");

	for (let i = 0; i < words.length; i++) {
		let word = createWord(words[i]);
		typingText.appendChild(word);
	}

	return {
		words: words,
		length: passage.length,
	};
}

async function listen() {
	let currWord = 0,
		currLetter = 0,
		extraLetterCount = 0,
		incorrectLetterIndex = -1,
		totalTyped = 0,
		seconds = 0,
		currVisibleWords,
		timeInterval,
		resizeTimeout;

	let hasStarted = false;
	let isListening = false;

	let wordsDOM;
	let words;
	let lines;
	let currLine = 0;

	function initializeCaret() {
		caret = document.createElement("div");
		caret.id = "caret";
		caret.classList.add("animation-caret-flash");
		moveCaretToNextWord(typingText.firstElementChild);
	}

	async function reset() {
		typingText.innerHTML = "";
		const passageData = await addTextToDOM();
		words = passageData.words;

		typingText.classList.remove("hidden");
		result.classList.add("hidden");

		wordsDOM = Array.from(document.querySelectorAll(".word"));
		wordsDOM[0].classList.add("active-word");

		lines = await getLine();

		caret?.remove();
		initializeCaret();

		clearInterval(timeInterval);

		isListening = true;
		hasStarted = false;

		currLetter = 0;
		currLine = 0;
		currVisibleWords = 0;
		currWord = 0;
		extraLetterCount = 0;
		incorrectLetterIndex = -1;
		seconds = 0;
		totalTyped = 0;
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

	async function getLine() {
		const typingTextWidth = parseFloat(window.getComputedStyle(typingText).width.slice(0, -2));
		const lines = [[]];
		let currWidth = 0;
		let wordWidth;

		for (let i = 0; i < wordsDOM.length; i++) {
			const item = wordsDOM[i];
			wordWidth = parseFloat(window.getComputedStyle(item).width.slice(0, -2));

			if (currWidth + wordWidth > typingTextWidth) {
				currWidth = 0;
				lines.push([]);
			}
			currWidth += (wordWidth + 19);
			lines[lines.length - 1].push(item);
		}

		return lines;
	}

	function startTimeCounting() {
		timeInterval = setInterval(() => {
			seconds += 0.5;
		}, 500);
	}

	function backspace(letters) {
		moveCaretHorizontal(-1);
		currLetter--;
		if (currLetter == incorrectLetterIndex) {
			wordsDOM[currWord].classList.remove("incorrect-word");
			incorrectLetterIndex = -1;
		}

		if (extraLetterCount > 0) {
			wordsDOM[currWord].removeChild(wordsDOM[currWord].lastChild);
			extraLetterCount--;
		} else {
			letters[currLetter].classList.remove("correct-letter");
			letters[currLetter].classList.remove("incorrect-letter");
		}
	}

	function space(letters) {
		moveCaretToNextWord(wordsDOM[currWord + 1]);
		totalTyped++;

		console.log("currLine :>> ", currLine);
		if (
			lines[currLine + 1] &&
			wordsDOM[currWord + 1] == lines[currLine + 1][0]
		) {
			++currLine;
		}

		console.log(currLine);
		if (currLine >= 2 && currLine + 1 < lines.length) {
			removeLine(currLine - 2);
			currLine = 1;
		}

		if (currLetter < words[currWord].length || incorrectLetterIndex != -1) {
			wordsDOM[currWord].classList.add("incorrect-word");
		}

		wordsDOM[currWord].classList.remove("active-word");
		wordsDOM[++currWord].classList.add("active-word");

		currLetter = 0;
		extraLetterCount = 0;
		incorrectLetterIndex = -1;
	}

	function correctTyped(letters) {
		moveCaretHorizontal(1);
		totalTyped++;
		letters[currLetter++].classList.add("correct-letter");
	}

	function extraTyped(letters) {
		moveCaretHorizontal(1);
		if (incorrectLetterIndex == -1) {
			wordsDOM[currWord].classList.add("incorrect-word");
			incorrectLetterIndex = currLetter;
		}

		extraLetterCount++;

		let extraLetter = createLetter(event.key);
		extraLetter.classList.add("extra-letter");
		wordsDOM[currWord].appendChild(extraLetter);
		extraLetter.classList.add("incorrect-letter");
		currLetter++;
	}

	function incorrectTyped(letters) {
		moveCaretHorizontal(1);
		if (incorrectLetterIndex == -1) {
			wordsDOM[currWord].classList.add("incorrect-word");
			incorrectLetterIndex = currLetter;
		}
		letters[currLetter++].classList.add("incorrect-letter");
	}

	function controlBackspace() {
		let i = currLetter;
		extraLetterCount = 0;

		while (
			i >= 0 &&
			wordsDOM[currWord].children[i].classList.contains("extra-letter")
		) {
			wordsDOM[currWord].removeChild(wordsDOM[currWord].lastElementChild);
			i--;
		}

		for (; i >= 0; i--) {
			wordsDOM[currWord].children[i].classList.remove("incorrect-letter");
			wordsDOM[currWord].children[i].classList.remove("correct-letter");
		}

		wordsDOM[currWord].classList.remove("incorrect-word");
		incorrectLetterIndex = -1;
		moveCaretToNextWord(wordsDOM[currWord]);
		currLetter = 0;
	}

	function showWPM() {
		typingText.classList.add("hidden");
		result.classList.remove("hidden");
		wpmDisplay.textContent =
			"WPM : " +
			Math.round((totalTyped / 5 / (seconds / 60)) * 100) / 100;
		hasStarted = false;
		isListening = false;
	}

	async function typingHandler(event) {
		if (event.key == "Enter") {
			await reset();
		}

		if (!isListening) return;

		let letters = wordsDOM[currWord].querySelectorAll("letter");

		if (event.key == "Backspace" && event.ctrlKey) {
			controlBackspace();
			return;
		}

		caret.classList.remove("animation-caret-flash");
		clearTimeout(caretTimeout);
		caretTimeout = setTimeout(() => {
			caret.classList.add("animation-caret-flash");
		}, 3000);

		if (event.key == "Backspace" && currLetter > 0) {
			backspace(letters);
			return;
		}

		if (event.key.length > 1) return;

		if (event.key == " ") {
			event.preventDefault();
			if (currLetter == 0) return;

			if (currWord == words.length - 1) {
				wpm = totalTyped / 5 / (seconds / 60);
				showWPM();
			} else {
				space(letters);
			}
		} else if (words[currWord][currLetter] == event.key) {
			if (
				currWord == words.length - 1 &&
				currLetter == words[currWord].length - 1
			) {
				wpm = totalTyped / 5 / (seconds / 60);
				showWPM();
			} else {
				if (!hasStarted) {
					startTimeCounting();
					hasStarted = true;
				}
				correctTyped(letters);
			}
		} else if (currLetter >= words[currWord].length) {
			if (extraLetterCount > 5) return;
			extraTyped(letters);
		} else {
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
			wordsDOM.reverse();
			words.reverse();
			for (let i = 0; i < currWord; i++) {
				wordsDOM[len - i - 1].remove();
				wordsDOM.pop();
				words.pop();
			}
			wordsDOM.reverse();
			words.reverse();

			lines = await getLine();
			currLine = 0;
			currWord = 0;
		}, 200);
	});
}

async function main() {
	await listen();
}

main();
