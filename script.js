document
  .getElementById("startCameraButton")
  .addEventListener("click", startCamera);
document
  .getElementById("captureButton")
  .addEventListener("click", captureImage);
document
  .getElementById("complaintForm")
  .addEventListener("submit", submitComplaint);

// Start the camera and display the video feed
async function startCamera() {
  const videoElement = document.getElementById("videoElement");
  const captureButton = document.getElementById("captureButton");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    captureButton.disabled = false;
  } catch (error) {
    alert("Error accessing camera: " + error);
  }
}

// Capture the image from the video feed
function captureImage() {
  const videoElement = document.getElementById("videoElement");
  const canvas = document.getElementById("canvas");
  const photoInput = document.getElementById("photo");

  // Set canvas dimensions to match the video feed
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw the current video frame onto the canvas
  const context = canvas.getContext("2d");
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Convert the canvas image to a data URL (base64 encoded image)
  const imageData = canvas.toDataURL("image/jpeg");

  // Display the captured image as a thumbnail
  const img = new Image();
  img.src = imageData;
  document.body.appendChild(img); // Optionally append the captured image for preview

  // Trigger file input with captured image data
  photoInput.files = dataURLtoFile(imageData, "captured.jpg");

  // Stop the camera feed
  const stream = videoElement.srcObject;
  const tracks = stream.getTracks();
  tracks.forEach((track) => track.stop());
}

// Convert a Data URL to a File object
function dataURLtoFile(dataURL, filename) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

// Submit the complaint form along with the captured photo
async function submitComplaint(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", document.getElementById("name").value);
  formData.append("contact", document.getElementById("contact").value);
  formData.append("complaint", document.getElementById("complaint").value);
  formData.append("latitude", document.getElementById("latitude").value);
  formData.append("longitude", document.getElementById("longitude").value);
  formData.append("photo", document.getElementById("photo").files[0]);

  try {
    const response = await fetch("http://localhost:3000/submit-complaint", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById("successMessage").style.display = "block";
      console.log("Submitted complaint:", result.complaint);
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err) {
    console.error("Error submitting complaint:", err);
    alert("An error occurred while submitting the complaint.");
  }
}

// Get the user's location using Geolocation API
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    document.getElementById("latitude").value = position.coords.latitude;
    document.getElementById("longitude").value = position.coords.longitude;
  });
}
