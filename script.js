// =====================================================
// VISIONZ - SMART EYE DISTANCE GUARD
// ESP32-C3 + VL53L0X + BLE
// =====================================================


// =====================================================
// BLE UUIDs
// Must exactly match ESP32 code
// =====================================================

const SERVICE_UUID =
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

const DISTANCE_UUID =
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e";


// =====================================================
// VARIABLES
// =====================================================

let visionDevice = null;
let distanceCharacteristic = null;

let protectionEnabled = false;
let currentDistance = 450;


// =====================================================
// GET HTML ELEMENTS
// =====================================================

const distanceElement =
    document.getElementById("distance");

const cmDistanceElement =
    document.getElementById("cmDistance");

const statusElement =
    document.getElementById("status");

const statusTextElement =
    document.getElementById("statusText");

const statusIconElement =
    document.getElementById("statusIcon");

const protectionButton =
    document.getElementById("protectionButton");

const protectionText =
    document.getElementById("protectionText");

const connectButton =
    document.getElementById("connectButton");

const connectionText =
    document.getElementById("connectionText");

const connectionDot =
    document.getElementById("connectionDot");

const blackOverlay =
    document.getElementById("blackOverlay");

const overlayDistance =
    document.getElementById("overlayDistance");


// =====================================================
// INITIAL STATE
// =====================================================

updateProtectionUI();


// =====================================================
// CONNECT BUTTON
// =====================================================

connectButton.addEventListener(
    "click",
    connectVisionZ
);


// =====================================================
// PROTECTION BUTTON
// =====================================================

protectionButton.addEventListener(
    "click",
    toggleProtection
);


// =====================================================
// CONNECT TO ESP32
// =====================================================

async function connectVisionZ() {

    try {

        // -------------------------------------------------
        // Check browser support
        // -------------------------------------------------

        if (!navigator.bluetooth) {

            alert(
                "Bluetooth is not supported in this browser."
            );

            return;
        }


        // -------------------------------------------------
        // Update UI
        // -------------------------------------------------

        connectionDot.innerText = "●";

        connectionText.innerText =
            "Searching for VisionZ...";


        // -------------------------------------------------
        // Find ESP32
        // -------------------------------------------------

        visionDevice =
            await navigator.bluetooth.requestDevice({

                filters: [
                    {
                        name: "VisionZ"
                    }
                ],

                optionalServices: [
                    SERVICE_UUID
                ]

            });


        // -------------------------------------------------
        // Connect GATT
        // -------------------------------------------------

        connectionText.innerText =
            "Connecting...";


        const server =
            await visionDevice.gatt.connect();


        // -------------------------------------------------
        // Get service
        // -------------------------------------------------

        const service =
            await server.getPrimaryService(
                SERVICE_UUID
            );


        // -------------------------------------------------
        // Get distance characteristic
        // -------------------------------------------------

        distanceCharacteristic =
            await service.getCharacteristic(
                DISTANCE_UUID
            );


        // -------------------------------------------------
        // Enable notifications
        // -------------------------------------------------

        await distanceCharacteristic.startNotifications();


        distanceCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleDistance
        );


        // -------------------------------------------------
        // Connected
        // -------------------------------------------------

        connectionDot.innerText = "●";

        connectionText.innerText =
            "VisionZ Connected";


        // -------------------------------------------------
        // Listen for disconnect
        // -------------------------------------------------

        visionDevice.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );


        console.log(
            "VisionZ connected successfully."
        );

    }

    catch (error) {

        console.error(
            "VisionZ connection error:",
            error
        );


        connectionText.innerText =
            "Connection Failed";


        alert(
            "Could not connect to VisionZ.\n\n" +
            error.message
        );
    }
}


// =====================================================
// RECEIVE DISTANCE FROM ESP32
// =====================================================

function handleDistance(event) {

    try {

        const value =
            event.target.value;


        const decoder =
            new TextDecoder();


        const text =
            decoder.decode(value).trim();


        const distance =
            parseInt(text);


        if (isNaN(distance)) {
            return;
        }


        console.log(
            "Distance received:",
            distance,
            "mm"
        );


        currentDistance =
            distance;


        updateDistanceUI(
            distance
        );

    }

    catch (error) {

        console.error(
            "Distance reading error:",
            error
        );
    }
}


// =====================================================
// UPDATE DISTANCE UI
// =====================================================

function updateDistanceUI(distance) {

    // -------------------------------------------------
    // MM
    // -------------------------------------------------

    distanceElement.innerText =
        distance;


    // -------------------------------------------------
    // CM
    // -------------------------------------------------

    const cm =
        (distance / 10).toFixed(1);


    cmDistanceElement.innerText =
        cm + " cm";


    // -------------------------------------------------
    // Overlay distance
    // -------------------------------------------------

    overlayDistance.innerText =
        distance + " mm";


    // -------------------------------------------------
    // Determine status
    // -------------------------------------------------

    if (distance >= 400) {

        // SAFE

        statusElement.innerText =
            "Safe";

        statusTextElement.innerText =
            "Your viewing distance is good.";

        statusIconElement.innerText =
            "✓";

    }

    else if (distance >= 300) {

        // WARNING

        statusElement.innerText =
            "Move Back";

        statusTextElement.innerText =
            "Your phone is getting too close.";

        statusIconElement.innerText =
            "!";

    }

    else {

        // TOO CLOSE

        statusElement.innerText =
            "Too Close";

        statusTextElement.innerText =
            "Please move your phone farther away.";

        statusIconElement.innerText =
            "⚠";

    }


    // -------------------------------------------------
    // BLACK SCREEN PROTECTION
    // -------------------------------------------------

    if (
        protectionEnabled &&
        distance < 300
    ) {

        showBlackOverlay();

    }

    else {

        hideBlackOverlay();

    }
}


// =====================================================
// SHOW BLACK SCREEN
// =====================================================

function showBlackOverlay() {

    blackOverlay.style.display =
        "flex";
}


// =====================================================
// HIDE BLACK SCREEN
// =====================================================

function hideBlackOverlay() {

    blackOverlay.style.display =
        "none";
}


// =====================================================
// PROTECTION TOGGLE
// =====================================================

function toggleProtection() {

    protectionEnabled =
        !protectionEnabled;


    updateProtectionUI();


    // Immediately update overlay
    // using latest distance

    updateDistanceUI(
        currentDistance
    );
}


// =====================================================
// UPDATE PROTECTION BUTTON
// =====================================================

function updateProtectionUI() {

    if (protectionEnabled) {

        protectionText.innerText =
            "Protection ON";

        protectionButton.innerText =
            "ON";

        protectionButton.classList.remove(
            "off"
        );

        protectionButton.classList.add(
            "on"
        );

    }

    else {

        protectionText.innerText =
            "Protection OFF";

        protectionButton.innerText =
            "OFF";

        protectionButton.classList.remove(
            "on"
        );

        protectionButton.classList.add(
            "off"
        );
    }
}


// =====================================================
// ESP32 DISCONNECTED
// =====================================================

function handleDisconnect() {

    connectionDot.innerText =
        "●";

    connectionText.innerText =
        "Connect Bluetooth";


    statusElement.innerText =
        "Waiting";

    statusTextElement.innerText =
        "Connect your VisionZ hardware";


    console.log(
        "VisionZ hardware disconnected."
    );
}