
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const baudrates = document.getElementById("baudrates");
const consoleBaudrates = document.getElementById("consoleBaudrates");
const reconnectDelay = document.getElementById("reconnectDelay");
const maxRetriesInput = document.getElementById("maxRetries");
const connectButton = document.getElementById("connectButton");
const traceButton = document.getElementById("copyTraceButton");
const disconnectButton = document.getElementById("disconnectButton");
const resetButton = document.getElementById("resetButton");
const consoleStartButton = document.getElementById("consoleStartButton");
const consoleStopButton = document.getElementById("consoleStopButton");
const eraseButton = document.getElementById("eraseButton");
const addFileButton = document.getElementById("addFile");
const programButton = document.getElementById("programButton");
const filesDiv = document.getElementById("files");
const terminal = document.getElementById("terminal");
const programDiv = document.getElementById("program");
const consoleDiv = document.getElementById("console");
const lblBaudrate = document.getElementById("lblBaudrate");
const lblConsoleBaudrate = document.getElementById("lblConsoleBaudrate");
const lblConsoleFor = document.getElementById("lblConsoleFor");
const lblConnTo = document.getElementById("lblConnTo");
const table = document.getElementById("fileTable");
const alertDiv = document.getElementById("alertDiv");
const flashMode = document.getElementById("flashMode");
const flashFreq = document.getElementById("flashFreq");
const flashSize = document.getElementById("flashSize");
const lblFlashMode = document.getElementById("lblFlashMode");
const lblFlashFreq = document.getElementById("lblFlashFreq");
const lblFlashSize = document.getElementById("lblFlashSize");
const debugLogging = document.getElementById("debugLogging");
// This is a frontend example of Esptool-JS using local bundle file
// To optimize use a CDN hosted version like
// https://unpkg.com/esptool-js@0.5.0/bundle.js
import { ESPLoader, Transport, } from "../../../lib";
import { serial } from "web-serial-polyfill";
const serialLib = !navigator.serial && navigator.usb ? serial : navigator.serial;
const term = new Terminal({ cols: 120, rows: 40 });
term.open(terminal);
let device = null;
let deviceInfo = null;
let transport;
let chip = null;
let esploader;
disconnectButton.style.display = "none";
traceButton.style.display = "none";
eraseButton.style.display = "none";
consoleStopButton.style.display = "none";
resetButton.style.display = "none";
filesDiv.style.display = "none";
flashMode.style.display = "none";
flashFreq.style.display = "none";
flashSize.style.display = "none";
lblFlashMode.style.display = "none";
lblFlashFreq.style.display = "none";
lblFlashSize.style.display = "none";
/**
 * The built in Event object.
 * @external Event
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Event}
 */
/**
 * File reader handler to read given local file.
 * @param {Event} evt File Select event
 */
function handleFileSelect(evt) {
    const file = evt.target.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        if (ev.target.result instanceof ArrayBuffer) {
            evt.target.data = new Uint8Array(ev.target.result);
        }
        else {
            evt.target.data = ev.target.result;
        }
    };
    reader.readAsArrayBuffer(file);
}
const espLoaderTerminal = {
    clean() {
        term.clear();
    },
    writeLine(data) {
        term.writeln(data);
    },
    write(data) {
        term.write(data);
    },
};
/**
 * Populate flash size and frequency dropdowns based on chip's supported values
 */
function populateFlashDropdowns() {
    if (!esploader || !esploader.chip) {
        return;
    }
    // Populate Flash Frequency dropdown
    flashFreq.innerHTML = '<option value="keep">Не изменять</option>';
    const flashFreqKeys = Object.keys(esploader.chip.FLASH_FREQUENCY).sort((a, b) => {
        const freqOrder = ["80m", "60m", "48m", "40m", "30m", "26m", "24m", "20m", "16m", "15m", "12m"];
        const indexA = freqOrder.indexOf(a);
        const indexB = freqOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1)
            return indexA - indexB;
        if (indexA !== -1)
            return -1;
        if (indexB !== -1)
            return 1;
        return a.localeCompare(b);
    });
    flashFreqKeys.forEach((freq) => {
        const option = document.createElement("option");
        option.value = freq;
        option.textContent = freq;
        flashFreq.appendChild(option);
    });
    flashFreq.options[0].selected = true;
    // Populate Flash Size dropdown
    flashSize.innerHTML = '<option value="detect">Определить</option><option value="keep">Не изменять</option>';
    const flashSizeKeys = Object.keys(esploader.chip.FLASH_SIZES).sort((a, b) => {
        const sizeOrder = [
            "256KB",
            "512KB",
            "1MB",
            "2MB",
            "2MB-c1",
            "4MB",
            "4MB-c1",
            "8MB",
            "16MB",
            "32MB",
            "64MB",
            "128MB",
        ];
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1)
            return indexA - indexB;
        if (indexA !== -1)
            return -1;
        if (indexB !== -1)
            return 1;
        return a.localeCompare(b);
    });
    flashSizeKeys.forEach((size) => {
        const option = document.createElement("option");
        option.value = size;
        option.textContent = size;
        flashSize.appendChild(option);
    });
    flashSize.options[1].selected = true;
}
connectButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (device === null) {
            device = yield serialLib.requestPort({});
            deviceInfo = device.getInfo();
            transport = new Transport(device, true);
        }
        const flashOptions = {
            transport,
            baudrate: parseInt(baudrates.value),
            terminal: espLoaderTerminal,
            debugLogging: debugLogging.checked,
        };
        esploader = new ESPLoader(flashOptions);
        traceButton.style.display = "initial";
        chip = yield esploader.main();
        // Populate flash dropdowns based on chip's supported values
        populateFlashDropdowns();
        // Temporarily broken
        // await esploader.flashId();
        // eslint-disable-next-line no-console
        console.log("Настройки готовы для:" + chip);
        lblBaudrate.style.display = "none";
        lblConnTo.innerHTML = "Подключено к устройству: " + chip;
        lblConnTo.style.display = "block";
        baudrates.style.display = "none";
        connectButton.style.display = "none";
        disconnectButton.style.display = "initial";
        eraseButton.style.display = "initial";
        filesDiv.style.display = "initial";
        flashMode.style.display = "initial";
        flashFreq.style.display = "initial";
        flashSize.style.display = "initial";
        lblFlashMode.style.display = "initial";
        lblFlashFreq.style.display = "initial";
        lblFlashSize.style.display = "initial";
        consoleDiv.style.display = "none";
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        term.writeln(`Error: ${e.message}`);
    }
});
traceButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    if (transport) {
        transport.returnTrace();
    }
});
resetButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    if (transport) {
        yield transport.setDTR(false);
        yield new Promise((resolve) => setTimeout(resolve, 100));
        yield transport.setDTR(true);
    }
});
eraseButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    eraseButton.disabled = true;
    try {
        yield esploader.eraseFlash();
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        term.writeln(`Ошибка: ${e.message}`);
    }
    finally {
        eraseButton.disabled = false;
    }
});
addFileButton.onclick = () => {
    const rowCount = table.rows.length;
    const row = table.insertRow(rowCount);
    //Column 1 - Offset
    const cell1 = row.insertCell(0);
    const element1 = document.createElement("input");
    element1.type = "text";
    element1.id = "offset" + rowCount;
    element1.value = "0x0";
    cell1.appendChild(element1);
    // Column 2 - File selector
    const cell2 = row.insertCell(1);
    const element2 = document.createElement("input");
    element2.type = "file";
    element2.id = "selectFile" + rowCount;
    element2.name = "selected_File" + rowCount;
    element2.addEventListener("change", handleFileSelect, false);
    cell2.appendChild(element2);
    // Column 3  - Progress
    const cell3 = row.insertCell(2);
    cell3.classList.add("progress-cell");
    cell3.style.display = "none";
    cell3.innerHTML = `<progress value="0" max="100"></progress>`;
    // Column 4  - Remove File
    const cell4 = row.insertCell(3);
    cell4.classList.add("action-cell");
    if (rowCount > 1) {
        const element4 = document.createElement("input");
        element4.type = "button";
        const btnName = "button" + rowCount;
        element4.name = btnName;
        element4.setAttribute("class", "btn");
        element4.setAttribute("value", "Remove"); // or element1.value = "button";
        element4.onclick = function () {
            removeRow(row);
        };
        cell4.appendChild(element4);
    }
};
/**
 * The built in HTMLTableRowElement object.
 * @external HTMLTableRowElement
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement}
 */
/**
 * Remove file row from HTML Table
 * @param {HTMLTableRowElement} row Table row element to remove
 */
function removeRow(row) {
    const rowIndex = Array.from(table.rows).indexOf(row);
    table.deleteRow(rowIndex);
}
/**
 * Clean devices variables on chip disconnect. Remove stale references if any.
 */
function cleanUp() {
    device = null;
    deviceInfo = null;
    transport = null;
    chip = null;
}
disconnectButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    if (transport)
        yield transport.disconnect();
    term.reset();
    lblBaudrate.style.display = "initial";
    baudrates.style.display = "initial";
    consoleBaudrates.style.display = "initial";
    connectButton.style.display = "initial";
    disconnectButton.style.display = "none";
    traceButton.style.display = "none";
    eraseButton.style.display = "none";
    lblConnTo.style.display = "none";
    filesDiv.style.display = "none";
    flashMode.style.display = "none";
    flashFreq.style.display = "none";
    flashSize.style.display = "none";
    lblFlashMode.style.display = "none";
    lblFlashFreq.style.display = "none";
    lblFlashSize.style.display = "none";
    alertDiv.style.display = "none";
    consoleDiv.style.display = "initial";
    cleanUp();
});
let isConsoleClosed = false;
let isReconnecting = false;
const sleep = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => setTimeout(resolve, ms));
});
consoleStartButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    if (device === null) {
        device = yield serialLib.requestPort({});
        transport = new Transport(device, true);
        deviceInfo = device.getInfo();
        // Set up device lost callback
        transport.setDeviceLostCallback(() => __awaiter(void 0, void 0, void 0, function* () {
            if (!isConsoleClosed && !isReconnecting) {
                term.writeln("\n[DEVICE LOST] Устройство отключено. Попытка переподключиться...");
                yield sleep(parseInt(reconnectDelay.value));
                isReconnecting = true;
                const maxRetries = parseInt(maxRetriesInput.value);
                let retryCount = 0;
                while (retryCount < maxRetries && !isConsoleClosed) {
                    retryCount++;
                    term.writeln(`\n[RECONNECT] Попытка ${retryCount}/${maxRetries}...`);
                    if (serialLib && serialLib.getPorts) {
                        const ports = yield serialLib.getPorts();
                        if (ports.length > 0) {
                            const newDevice = ports.find((port) => port.getInfo().usbVendorId === deviceInfo.usbVendorId &&
                                port.getInfo().usbProductId === deviceInfo.usbProductId);
                            if (newDevice) {
                                device = newDevice;
                                transport.updateDevice(device);
                                term.writeln("[RECONNECT] Найдено ранее авторизированное устройство, подключение...");
                                yield transport.connect(parseInt(consoleBaudrates.value));
                                term.writeln("[RECONNECT] Успешно переподключено!");
                                consoleStopButton.style.display = "initial";
                                resetButton.style.display = "initial";
                                isReconnecting = false;
                                startConsoleReading();
                                return;
                            }
                        }
                    }
                    if (retryCount < maxRetries) {
                        term.writeln(`[RECONNECT] Устройство не найдено, попытка через ${parseInt(reconnectDelay.value)}мс...`);
                        yield sleep(parseInt(reconnectDelay.value));
                    }
                }
                if (retryCount >= maxRetries) {
                    term.writeln("\n[RECONNECT] Не удалось подключиться за 5 попыток. Пожалуйста, переподключите вручную.");
                    isReconnecting = false;
                }
            }
        }));
    }
    lblConsoleFor.style.display = "block";
    lblConsoleBaudrate.style.display = "none";
    consoleBaudrates.style.display = "none";
    consoleStartButton.style.display = "none";
    consoleStopButton.style.display = "initial";
    resetButton.style.display = "initial";
    programDiv.style.display = "none";
    yield transport.connect(parseInt(consoleBaudrates.value));
    isConsoleClosed = false;
    isReconnecting = false;
    startConsoleReading();
});
/**
 * Start the console reading loop
 */
function startConsoleReading() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isConsoleClosed || !transport)
            return;
        try {
            while (true && !isConsoleClosed) {
                const value = yield transport.rawRead();
                if (!value || value.length === 0) {
                    break;
                }
                term.write(value);
            }
        }
        catch (error) {
            if (!isConsoleClosed) {
                term.writeln(`\n[CONSOLE ERROR] ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        if (!isConsoleClosed) {
            term.writeln("\n[CONSOLE] Подключение разоварно, ожидается переподключение...");
        }
    });
}
consoleStopButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    isConsoleClosed = true;
    isReconnecting = false;
    if (transport) {
        yield transport.disconnect();
        yield transport.waitForUnlock(1500);
    }
    term.reset();
    lblConsoleBaudrate.style.display = "initial";
    consoleBaudrates.style.display = "initial";
    consoleStartButton.style.display = "initial";
    consoleStopButton.style.display = "none";
    resetButton.style.display = "none";
    lblConsoleFor.style.display = "none";
    programDiv.style.display = "initial";
    cleanUp();
});
/**
 * Validate the provided files images and offset to see if they're valid.
 * @returns {string} Program input validation result
 */
function validateProgramInputs() {
    const offsetArr = [];
    const rowCount = table.rows.length;
    let row;
    let offset = 0;
    let fileData = null;
    // check for mandatory fields
    for (let index = 1; index < rowCount; index++) {
        row = table.rows[index];
        //offset fields checks
        const offSetObj = row.cells[0].childNodes[0];
        offset = parseInt(offSetObj.value);
        // Non-numeric or blank offset
        if (Number.isNaN(offset))
            return "Поле смещения в строке " + index + " не является валидным адресом!";
        // Repeated offset used
        else if (offsetArr.includes(offset))
            return "Поле смещения в строке " + index + " уже используется!";
        else
            offsetArr.push(offset);
        const fileObj = row.cells[1].childNodes[0];
        fileData = fileObj.data;
        if (fileData == null)
            return "Отсутствует файл в строке " + index + "!";
    }
    return "Успешно";
}
programButton.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
    const alertMsg = document.getElementById("alertmsg");
    const err = validateProgramInputs();
    if (err != "Успешно") {
        alertMsg.innerHTML = "<strong>" + err + "</strong>";
        alertDiv.style.display = "block";
        return;
    }
    // Hide error message
    alertDiv.style.display = "none";
    const fileArray = [];
    const progressBars = [];
    for (let index = 1; index < table.rows.length; index++) {
        const row = table.rows[index];
        const offSetObj = row.cells[0].childNodes[0];
        const offset = parseInt(offSetObj.value);
        const fileObj = row.cells[1].childNodes[0];
        const progressBar = row.cells[2].childNodes[0];
        progressBar.textContent = "0";
        progressBars.push(progressBar);
        row.cells[2].style.display = "initial";
        row.cells[3].style.display = "none";
        fileArray.push({ data: fileObj.data, address: offset });
    }
    try {
        const flashOptions = {
            fileArray: fileArray,
            eraseAll: false,
            compress: true,
            flashMode: flashMode.value,
            flashFreq: flashFreq.value,
            flashSize: flashSize.value,
            reportProgress: (fileIndex, written, total) => {
                progressBars[fileIndex].value = (written / total) * 100;
            },
            calculateMD5Hash: (image) => {
                const latin1String = Array.from(image, (byte) => String.fromCharCode(byte)).join("");
                return CryptoJS.MD5(CryptoJS.enc.Latin1.parse(latin1String)).toString();
            },
        };
        yield esploader.writeFlash(flashOptions);
        yield esploader.after();
    }
    catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        term.writeln(`Error: ${e.message}`);
    }
    finally {
        // Hide progress bars and show erase buttons
        for (let index = 1; index < table.rows.length; index++) {
            table.rows[index].cells[2].style.display = "none";
            table.rows[index].cells[3].style.display = "initial";
        }
    }
});
addFileButton.onclick(this);
