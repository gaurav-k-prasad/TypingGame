const URL = "http://metaphorpsum.com/paragraphs/1/2";
const typingText = document.querySelector(".typing-text");
let caretPositionLeft = 0;
let caret;
let caretTimeout;

async function getPassage() {
	const response = await axios.get(URL);
	return response.data;
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
	const words = passage.split(" ");

	for (let i = 0; i < words.length - 1; i++) {
		let word = createWord(words[i]);
		typingText.appendChild(word);
	}
	typingText.appendChild(createWord(words[words.length - 1]));

	return words;
}

async function listen() {
	let currWord = 0,
		currLetter = 0,
		extraLetterCount = 0,
		incorrectLetterIndex = -1;

	let wordsDOM;
	let words;

	async function reset() {
		typingText.innerHTML = "";
		words = await addTextToDOM();
		wordsDOM = document.querySelectorAll(".word");
		wordsDOM[0].classList.add("active-word");
		caret?.remove();

		caret = document.createElement("div");
		caret.id = "caret";
		caret.classList.add("animation-caret-flash");
		moveCaretToNextWord(typingText.firstElementChild);
		currWord = 0;
		currLetter = 0;
		extraLetterCount = 0;
		incorrectLetterIndex = -1;
	}

	await reset();

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

	document.addEventListener("keydown", async (event) => {
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
			if (currLetter == 0) return;

			if (currWord == words.length - 1) await reset();
			else space(letters);
		} else if (words[currWord][currLetter] == event.key) {
			correctTyped(letters);
		} else if (currLetter >= words[currWord].length) {
			if (extraLetterCount > 5) return;
			extraTyped(letters);
		} else {
			incorrectTyped(letters);
		}
	});
}

async function main() {
	await listen();
}

main();
