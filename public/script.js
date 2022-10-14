const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const mainRight = document.querySelector(".main__right");
const allVideosElements = document.getElementsByTagName("VIDEO");
const finish = document.getElementById("finish");
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let myVideoStream;
// const stopVideo = document.querySelector("#stopVideo");
var peer = new Peer({
  path: "/peerjs",
  host: "/",
  port: "443",
});

/**
 * @param  {HTMLElement} myVideo
 * Prevent user self voice turn loop
 */
myVideo.muted = true;
/**
 * @param {Boolean} toggle
 * @return {Boolean }
 * When under the 700px chat section open-close toggle
 */
let toggle = false;

/**
 * Toggle for Message Area
 */
showChat.addEventListener("click", () => {
  toggle = !toggle;

  if (toggle == true) {
    mainRight.style.display = "block";
  } else {
    mainRight.style.display = "none";
  }
});

/**
 * @param {HTMLElement} inviteButton
 *
 */
inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

/**
 * @param {HTMLElement} finish
 * @return {HTMLElement}
 * finish represant html finish element
 */

finish.addEventListener("click", () => {
  Swal.fire({
    title: "Sohbetten Ayrılmak Üzeresiniz?",
    text: "",
    icon: "warning",
    showCancelButton: false,
    confirmButtonText: "Sohbetten Çık!",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire("Hoşçakalın", "Oturumunuz başarı ile sonlandı.", "success");
      window.location.href = "https://www.google.com/";
    }
  });
});

//********************************* STREAM - ENGINE **************************************/

if (myVideoStream != undefined || myVideoStream != null)
  myVideoStream.getAudioTracks()[0].enabled = true;

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new window.SpeechRecognition();
recognition.interimResults = true;
recognition.lang = "tr-TR";
recognition.addEventListener("result", (e) => {
  const text = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("");

  let commands = ["Antalya", "Denizli", "İzmir", "mal"];

  let currentCommand = commands.filter((e) => {
    if (e == text) {
      return e;
    }
  });
  if (e.results[0].isFinal) {
    if (text.includes(currentCommand[0])) {
      switch (currentCommand[0]) {
        case "Antalya":
          console.log("antalya etti");
          break;
        case "Denizli":
          console.log("denizli dedi");
          break;
        case "İzmir":
          console.log("izmir dedi", new Date().getTime());
          break;
        case "mal":
          console.log("sensin mal");
          break;

        default:
          console.log("status");
      }
    }
  }
});
recognition.addEventListener("end", () => {
  recognition.start();
});

recognition.start();

const user = "User-" + String(Math.floor(Math.random() * 999999));

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: false,
  })
  .then((stream) => {
    myVideoStream = stream;

    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

muteButton.addEventListener("click", () => {
  let html;
  const enabled = myVideoStream?.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;

    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;

    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});
// stopVideo.addEventListener("click", () => {
//   let html;
//   const enabled = myVideoStream.getVideoTracks()[0].enabled;
//   if (enabled) {
//     myVideoStream.getVideoTracks()[0].enabled = false;
//     html = `<i class="fas fa-video-slash"></i>`;
//     stopVideo.classList.toggle("background__red");
//     stopVideo.innerHTML = html;
//   } else {
//     myVideoStream.getVideoTracks()[0].enabled = true;
//     html = `<i class="fas fa-video"></i>`;
//     stopVideo.classList.toggle("background__red");
//     stopVideo.innerHTML = html;
//   }
// });

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});
