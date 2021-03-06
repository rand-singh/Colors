// global selections and vars
const colorDivs = document.querySelectorAll(".color");
const generateButton = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const adjustButtons = document.querySelectorAll(".adjust");
const lockButtons = document.querySelectorAll(".lock");
const copyButtons = document.querySelectorAll(".copy");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");
const copyToolTip = document.querySelector(".copy-tool-tip-container");
let initialColors;
// for local storage
let savedPalettes = [];

// add event listeners
generateButton.addEventListener("click", randomColors);

sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});

colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});

currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copytoClipboard(hex);
  });
});

copyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    copytoClipboard(button.parentNode.parentNode.firstElementChild);
  });
});

copyToolTip.addEventListener("animationend", () => {
  copyToolTip.classList.remove("active");
});

adjustButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    openAdjustmentPanel(index);
  });
});

closeAdjustments.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});

lockButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    lockColor(button, index);
  });
});

document.body.onkeyup = function (e) {
  if (!document.body.classList.contains("modal-active")) {
    switch (e.keyCode) {
      case 32:
        randomColors();
        break;
      case 83:
        openPalette();
        break;
      case 76:
        openLibrary();
    }
  }
  if (document.body.classList.contains("modal-active") && e.keyCode === 27) {
    console.log("escape to close popup");
    closePalette();
    closeLibrary();
  }
};

// functions
// color generator
function generateHex() {
  const hexColor = chroma.random();
  return hexColor;
}

function randomColors() {
  initialColors = [];

  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();
    // add to array
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText);
      return;
    } else {
      initialColors.push(chroma(randomColor).hex());
    }

    //add color to background and set h tag
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;
    // check contrast
    checkTextContrast(randomColor, hexText);
    // initialise colorize sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });
  //reset inputs
  resetInputs();
  // check button contrast
  adjustButtons.forEach((button, index) => {
    checkTextContrast(initialColors[index], button);
    checkTextContrast(initialColors[index], lockButtons[index]);
    checkTextContrast(initialColors[index], copyButtons[index]);
  });
}

function checkTextContrast(color, text) {
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

function colorizeSliders(color, hue, brightness, saturation) {
  // scale saturation
  const noSat = color.set("hsl.s", 0);
  const fullSat = color.set("hsl.s", 1);
  const scaleSat = chroma.scale([noSat, color, fullSat]);
  // scale brightness
  const midBright = color.set("hsl.l", 0.5);
  const scaleBright = chroma.scale(["black", midBright, "white"]);

  // Update input colors
  saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(
    0
  )}, ${scaleSat(1)})`;
  brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(
    0
  )}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75,75,204), rgb(204,75,204), rgb(204,75,75))`;
}

function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat") ||
    e.target.getAttribute("data-hue");

  let sliders = e.target.parentElement.querySelectorAll('input[type="range"');
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];

  const bgColor = initialColors[index];

  let color = chroma(bgColor)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value)
    .set("hsl.h", hue.value);

  colorDivs[index].style.backgroundColor = color;

  // color slider inputs
  colorizeSliders(color, hue, brightness, saturation);
}
function updateTextUI(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex();
  //check contrast
  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

function resetInputs() {
  const sliders = document.querySelectorAll(".sliders input");
  sliders.forEach((slider) => {
    if (slider.name === "hue") {
      const hueColor = initialColors[slider.getAttribute("data-hue")];
      const hueValue = chroma(hueColor).hsl()[0];
      slider.value = Math.floor(hueValue);
    }
    if (slider.name === "brightness") {
      const brightColor = initialColors[slider.getAttribute("data-bright")];
      const brightValue = chroma(brightColor).hsl()[2];
      slider.value = Math.floor(brightValue * 100) / 100;
    }

    if (slider.name === "saturation") {
      const satColor = initialColors[slider.getAttribute("data-sat")];
      const satValue = chroma(satColor).hsl()[1];
      slider.value = Math.floor(satValue * 100) / 100;
    }
  });
}
function copytoClipboard(hex) {
  const el = document.createElement("textarea");
  el.value = hex.innerText;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);

  // pop up animation
  const bottom = hex.getBoundingClientRect().bottom;
  const left = hex.getBoundingClientRect().left;
  const hexWidth = hex.clientWidth;
  const copyToolTipWidth = copyToolTip.clientWidth;
  const amount = (copyToolTipWidth - hexWidth) / 2;
  const actual = left - amount;

  copyToolTip.style.top = `${bottom}px`;
  copyToolTip.style.left = `${actual}px`;
  copyToolTip.classList.add("active");
}
function openAdjustmentPanel(index) {
  sliderContainers[index].classList.toggle("active");
}
function closeAdjustmentPanel(index) {
  sliderContainers[index].classList.remove("active");
}
function lockColor(button, index) {
  colorDivs[index].classList.toggle("locked");
  button.children[0].classList.toggle("fa-lock-open");
  button.children[0].classList.toggle("fa-lock");
}

// save to palette and local storage
const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");

// event listeners
saveBtn.addEventListener("click", openPalette); // function name is confusing
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);

saveInput.addEventListener("input", (e) => {
  if (e.target.value === "") {
    e.target.classList.add("error");
  } else {
    e.target.classList.remove("error");
  }
});

saveInput.addEventListener("keyup", (e) => {
  if (e.keyCode === 13 && saveInput.value !== "") {
    savePalette();
    return;
  }
});

// function name is confusing
function openPalette() {
  const popup = saveContainer.children[0];
  saveContainer.classList.add("active");
  popup.classList.add("active");
  saveInput.focus();
  document.body.classList.add("modal-active");
}

function closePalette() {
  const popup = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  saveInput.value = "";
  document.body.classList.remove("modal-active");
}

function savePalette(e) {
  const name = saveInput.value;

  if (name === "") {
    console.error("enter palette name");
    saveInput.focus();
    saveInput.classList.add("error");
    return;
  }

  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  const colors = [];
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });

  // generate object
  let paletteNr;

  const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
  if (paletteObjects) {
    paletteNr = paletteObjects.length;
  } else {
    paletteNr = savedPalettes.length;
  }

  const paletteObj = { name, colors, nr: paletteNr };
  savedPalettes.push(paletteObj);
  // save to local storage
  saveToLocal(paletteObj);
  saveInput.value = "";

  // generate the palette for library
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");
  const title = document.createElement("h4");
  title.innerText = paletteObj.name;
  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  paletteObj.colors.forEach((smallColor) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });
  const paletteBtn = document.createElement("button");
  paletteBtn.classList.add("pick-palette-btn");
  paletteBtn.classList.add(paletteObj.nr);
  paletteBtn.innerText = "Select";

  // attach event to select palette button
  paletteBtn.addEventListener("click", (e) => {
    closeLibrary();
    const paletteIndex = e.target.classList[1];
    initialColors = [];
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const text = colorDivs[index].children[0];
      checkTextContrast(color, text);
      updateTextUI(index);

      // is this need when we save a palette?
      // const c = chroma(color);
      // const sliders = sliderContainers[index].querySelectorAll(
      //   "input[type='range']"
      // );
      // const hue = sliders[0];
      // const brightness = sliders[1];
      // const saturation = sliders[2];
      // colorizeSliders(c, hue, brightness, saturation);
    });
    resetInputs();
  });

  //  delete palette from library
  const deletePaletteBtn = document.createElement("button");
  deletePaletteBtn.classList.add("delete-palette-btn");
  deletePaletteBtn.classList.add(paletteObj.nr);
  deletePaletteBtn.innerText = "Delete";

  deletePaletteBtn.addEventListener("click", () => {
    const library = JSON.parse(localStorage.getItem("palettes"));

    const filtered = library.filter((value) => {
      if (value.nr !== paletteObj.nr) return value;
    });

    localStorage.setItem("palettes", JSON.stringify(filtered));
  });

  //append to library
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteBtn);
  palette.appendChild(deletePaletteBtn);
  libraryContainer.children[0].appendChild(palette);
  updateLibraryCount();

  document.body.classList.remove("modal-active");
}

function saveToLocal(paletteObj) {
  let localPalettes;
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    localPalettes = JSON.parse(localStorage.getItem("palettes"));
  }
  localPalettes.push(paletteObj);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
  document.body.classList.add("modal-active");
}

function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
  document.body.classList.remove("modal-active");
}

function getLocal() {
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
    // disable the library button
  } else {
    // enable the library button
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));

    savedPalettes = [...paletteObjects];

    paletteObjects.forEach((paletteObj) => {
      const palette = document.createElement("div");
      palette.classList.add("custom-palette");

      const title = document.createElement("h4");
      title.innerText = paletteObj.name;

      const preview = document.createElement("div");
      preview.classList.add("small-preview");

      paletteObj.colors.forEach((smallColor) => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
      });

      const paletteBtn = document.createElement("button");
      paletteBtn.classList.add("pick-palette-btn");
      paletteBtn.classList.add(paletteObj.nr);
      paletteBtn.innerText = "Select";

      // attach event to select palette button
      paletteBtn.addEventListener("click", (e) => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];

        initialColors = [];

        paletteObjects[paletteIndex].colors.forEach((color, index) => {
          if (!colorDivs[index].classList.contains("locked")) {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
            updateTextUI(index);
            const c = chroma(color);
            const sliders = sliderContainers[index].querySelectorAll(
              "input[type='range']"
            );
            const hue = sliders[0];
            const brightness = sliders[1];
            const saturation = sliders[2];
            colorizeSliders(c, hue, brightness, saturation);
          } else {
            initialColors.push(
              chroma(colorDivs[index].style.backgroundColor).hex()
            );
          }
        });
        resetInputs();
      });

      //  delete palette from library
      const deletePaletteBtn = document.createElement("button");
      deletePaletteBtn.classList.add("delete-palette-btn");
      deletePaletteBtn.classList.add(paletteObj.nr);
      deletePaletteBtn.innerText = "Delete";

      deletePaletteBtn.addEventListener("click", () => {
        const library = JSON.parse(localStorage.getItem("palettes"));

        const filtered = library.filter((value) => {
          if (value.nr !== paletteObj.nr) return value;
        });

        localStorage.setItem("palettes", JSON.stringify(filtered));
        updateLibraryCount();
        reloadLibary();
      });

      //append to library
      palette.appendChild(title);
      palette.appendChild(preview);
      palette.appendChild(paletteBtn);
      palette.appendChild(deletePaletteBtn);
      libraryContainer.children[0].appendChild(palette);
    });
  }
}

function reloadLibary() {
  const domLibPalette = document.querySelectorAll(".custom-palette");
  domLibPalette.forEach((palette) => {
    palette.remove();
  });

  getLocal();
}

// app start
getLocal();
randomColors();
(function () {
  sessionStorage.removeItem("palettes-history");
})();

// observer for back/undo feature
const backSection = document.querySelector(".back-section");
const backButton = document.querySelector(".back");
const historyCount = document.querySelector(".history-count");

backButton.addEventListener("click", () => {
  if (sessionStorage.getItem("palettes-history") === null) {
    console.error("no history found, button should be disabled");
  } else {
    observer.disconnect();

    const palettesHist = JSON.parse(sessionStorage.getItem("palettes-history"));
    const lastPalette = palettesHist.length - 1;

    palettesHist[lastPalette].forEach((hex, index) => {
      colorDivs[index].style.backgroundColor = hex;
      const text = colorDivs[index].children[0];
      checkTextContrast(hex, text);
      updateTextUI(index);

      const c = chroma(hex);
      const sliders = sliderContainers[index].querySelectorAll(
        "input[type='range']"
      );
      const hue = sliders[0];
      const brightness = sliders[1];
      const saturation = sliders[2];
      colorizeSliders(c, hue, brightness, saturation);
    });
    resetInputs();

    palettesHist.pop();

    if (palettesHist.length === 0) {
      backSection.classList.remove("active");
    }

    saveToSession(palettesHist, true);
    updateHistoryCount();
  }
});

const config = {
  attributes: false,
  childList: true,
  subtree: false,
};

const callback = function (mutationsList, observer) {
  if (mutationsList.length === 5) {
    let changedColors = [];

    mutationsList.forEach((mutation) => {
      changedColors.push(mutation.removedNodes[0].textContent);
    });

    saveToSession(changedColors);
  } else {
    // only one has changed, which one
    const whichOne = mutationsList[0].target.getAttribute("data-hex");
    const oldHex = mutationsList[0].removedNodes[0].textContent;
    let changedColors = [];
    currentHexes.forEach((hex) => {
      changedColors.push(hex.innerText);
    });

    changedColors[whichOne] = oldHex;
    saveToSession(changedColors);
  }

  backButton.parentElement.classList.add("active");
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

currentHexes.forEach((hex) => {
  // Start observing the target node for configured mutations
  observer.observe(hex, config);
});

function saveToSession(newHex, override = false) {
  let sessionPalettes = [];

  if (override === true) {
    sessionStorage.setItem("palettes-history", JSON.stringify(newHex));
    currentHexes.forEach((hex) => {
      // Start observing the target node for configured mutations
      observer.observe(hex, config);
    });
  } else {
    if (sessionStorage.getItem("palettes-history") === null) {
      sessionPalettes = [];
    } else {
      sessionPalettes = JSON.parse(sessionStorage.getItem("palettes-history"));
    }
    sessionPalettes.push(newHex);
    sessionStorage.setItem("palettes-history", JSON.stringify(sessionPalettes));
  }
  updateHistoryCount();
}

// palette count markers
const libraryCount = document.querySelector(".palettes-saved");

function updateLibraryCount() {
  if (localStorage.getItem("palettes") !== null) {
    let nrPalettesInLibrary = JSON.parse(localStorage.getItem("palettes"))
      .length;
    libraryCount.innerText = nrPalettesInLibrary;
    libraryCount.classList.add("visible");
  }
}

updateLibraryCount();

function updateHistoryCount() {
  if (sessionStorage.getItem("palettes-history") !== null) {
    let nrPalettesInHistory = JSON.parse(
      sessionStorage.getItem("palettes-history")
    ).length;
    historyCount.innerText = nrPalettesInHistory;
    historyCount.classList.add("visible");
    if (nrPalettesInHistory === 0) {
      historyCount.classList.remove("visible");
    }
  } else {
    historyCount.classList.remove("visible");
  }
}

// Zen mode
const activateZen = document.querySelector(".activate-zen");
const exitZen = document.querySelector(".exit-zen");

activateZen.addEventListener("click", () => {
  document.body.classList.add("zen");
  sliderContainers.forEach((adjPanel, index) => {
    closeAdjustmentPanel(index);
  });
});

exitZen.addEventListener("click", () => {
  document.body.classList.remove("zen");
});

// close popups on click outside
saveContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("save-container")) closePalette();
});

libraryContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("library-container")) closeLibrary();
});
