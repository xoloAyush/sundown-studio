// Initialize Lenis
const lenis = new Lenis({
    autoRaf: true,
    duration: 1.5,
    smoothWheel: true,
    smoothTouch: false
});

// ---------- Nav buttons: smooth scroll to sections ----------
document.querySelectorAll("[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target;

        if (target === "bottom") {
            lenis.scrollTo(lenis.limit, { duration: 2 });
        } else {
            lenis.scrollTo(target, { offset: 0, duration: 1.8 });
        }
    });
});
// ---------- Hero intro: 3D title, then block-reveal paragraph ----------
gsap.registerPlugin(SplitText);

// reusable: returns a timeline that block-reveals every line of an element
function buildBlockReveal(el, { gap = 0.3, dur = 0.5 } = {}) {
    const textColor = getComputedStyle(el).color;
    const split = SplitText.create(el, { type: "lines", linesClass: "reveal-line" });

    split.lines.forEach(line => {
        const block = document.createElement("span");
        block.className = "reveal-block";
        line.appendChild(block);
    });
    gsap.set(split.lines, { color: "transparent" });
    gsap.set(el, { visibility: "visible" });

    const tl = gsap.timeline({ paused: true });

    split.lines.forEach((line, i) => {
        const block = line.querySelector(".reveal-block");
        const t = i * gap;

        tl.fromTo(block,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: dur, ease: "power3.inOut" }, t);
        tl.set(line, { color: textColor }, t + dur);
        tl.set(block, { transformOrigin: "right center" }, t + dur);
        tl.to(block, { scaleX: 0, duration: dur, ease: "power3.inOut" }, t + dur);
    });

    return tl;
}

document.fonts.ready.then(() => {
    const title = document.querySelector("#hero #right h4");
    const para  = document.querySelector("#hero #left h4");

    const titleSplit = SplitText.create(title, {
        type: "words, chars",
        wordsClass: "word",
        charsClass: "char"
    });
    gsap.set(title, { visibility: "visible" });

    // split the paragraph now, while it is still at its final size
    const paraReveal = buildBlockReveal(para);

    const tl = gsap.timeline({ delay: 0.3 });

    // 1) 3D title
    tl.from(titleSplit.chars, {
        opacity: 0,
        rotateX: -90,
        y: 40,
        transformOrigin: "50% 100% -30px",
        duration: 1,
        ease: "power3.out",
        stagger: 0.04
    });

    // 2) paragraph block reveal, starting just before the title ends
    tl.add(paraReveal.play(0), "-=0.3");
});

const fixed = document.querySelector("#fixed-image");
const container = document.querySelector("#elem-container");
const elemC = Array.from(document.querySelectorAll(".elem"));

fixed.style.overflow = "hidden";
fixed.style.backgroundColor = "transparent";

let currentIndex = -1;   // which row the preview is currently showing
let currentLayer = null; // the image layer currently on screen

// preload so images don't flash when they slide in
elemC.forEach(el => { new Image().src = el.getAttribute("data-image"); });

function showImage(index, src) {
    const layer = document.createElement("div");
    layer.className = "fi-layer";

    // inline styles so this works even if the CSS snippet is missing/overwritten
    Object.assign(layer.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundImage: `url("${src}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        willChange: "transform",
        transition: "transform 0.7s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.4s ease"
    });

    if (!currentLayer) {
        // first hover: simple fade in
        fixed.style.display = "block";
        layer.style.opacity = "0";
        fixed.appendChild(layer);
        layer.offsetHeight;            // force reflow so the transition runs
        layer.style.opacity = "1";
    } else {
        // moving DOWN the list (index grows) -> new image comes from the bottom
        // moving UP the list (index shrinks) -> new image comes from the top
        const dir = index > currentIndex ? 1 : -1;
        const old = currentLayer;

        layer.style.transform = `translateY(${dir * 100}%)`;
        fixed.appendChild(layer);
        layer.offsetHeight;            // force reflow

        layer.style.transform = "translateY(0)";
        old.style.transform = `translateY(${-dir * 100}%)`;

        setTimeout(() => old.remove(), 800);
    }

    currentLayer = layer;
    currentIndex = index;
}

elemC.forEach((el, index) => {
    el.addEventListener("mouseenter", () => {
        showImage(index, el.getAttribute("data-image"));
    });
});

// hide only when the mouse leaves the WHOLE list, so moving between rows
// keeps the direction logic alive
container.addEventListener("mouseleave", () => {
    fixed.style.display = "none";
    fixed.innerHTML = "";
    currentLayer = null;
    currentIndex = -1;
});
// -----------------------------------------
var swiper = new Swiper(".mySwiper", {
  slidesPerView: 1.2,      // phones: one card plus a peek of the next
  spaceBetween: 20,
  breakpoints: {
    600:  { slidesPerView: 2.2, spaceBetween: 30 },   // large phones / small tablets
    1025: { slidesPerView: 3.6, spaceBetween: 40 }    // desktop (your original)
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

// ---------------------------------

const changeSlides = {
    1: {
        img: "../public/design.webp",
        text: "We design high-impact brand experiences that connect visually and emotionally with audiences."
    },
    2: {
        img: "../public/projects.webp",
        text: "We manage and build your project with precision, from planning to final execution."
    },
    3: {
        img: "../public/execution.webp",
        text: "We execute flawless installations and setups, ensuring everything is perfect on launch day."
    }
};

const changeTitles = document.querySelectorAll("#page-change #left h2");
let activeSlide = 1;      // the HTML starts on "Design"
let slideBusy = false;

function setActiveTitle(num) {
    changeTitles.forEach((h, i) => h.classList.toggle("active", i === num - 1));
}
setActiveTitle(1);

function changeContent(num) {
    if (slideBusy) return;

    const text = document.getElementById("change-text");
    const data = changeSlides[num];

    setActiveTitle(num);
    text.innerText = data.text;            // text just changes, no animation

    if (num === activeSlide) return;       // same tab: nothing to slide
    slideBusy = true;

    const oldImg = document.getElementById("right-img");
    const newImg = oldImg.cloneNode();
    newImg.removeAttribute("id");
    newImg.src = data.img;
    Object.assign(newImg.style, { position: "absolute", top: "0", left: "0" });
    oldImg.parentElement.appendChild(newImg);

    const run = () => {
        const tl = gsap.timeline({
            onComplete: () => {
                oldImg.remove();
                newImg.id = "right-img";
                newImg.removeAttribute("style");
                activeSlide = num;
                slideBusy = false;
            }
        });

        // old image goes down, new one comes from the top
        tl.fromTo(newImg, { yPercent: -100 }, { yPercent: 0, duration: 0.9, ease: "power3.inOut" }, 0);
        tl.to(oldImg, { yPercent: 100, duration: 0.9, ease: "power3.inOut" }, 0);
    };

    if (newImg.complete) run();
    else newImg.onload = run;
}


// ---------- Block text reveal: "We are a group of design-driven..." ----------
gsap.registerPlugin(SplitText, ScrollTrigger);

// keep Lenis and ScrollTrigger in sync
lenis.on("scroll", ScrollTrigger.update);

document.fonts.ready.then(() => {
    const heading = document.querySelector("#bottom-page2 #left h1");
    const textColor = getComputedStyle(heading).color;

    const split = SplitText.create(heading, {
        type: "lines",
        linesClass: "reveal-line"
    });

    // add a black block to every line and hide the text itself
    split.lines.forEach(line => {
        const block = document.createElement("span");
        block.className = "reveal-block";
        line.appendChild(block);
    });
    gsap.set(split.lines, { color: "transparent" });
    gsap.set(heading, { visibility: "visible" });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: heading,
            start: "top 80%",
            once: true
        }
    });

    split.lines.forEach((line, i) => {
        const block = line.querySelector(".reveal-block");
        const t = i * 0.3;   // each line starts 0.3s after the previous one

        // 1) block wipes in over the text, left to right
        tl.fromTo(block,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 0.5, ease: "power3.inOut" },
            t
        );

        // 2) while it covers the line, switch the text on
        tl.set(line, { color: textColor }, t + 0.5);
        tl.set(block, { transformOrigin: "right center" }, t + 0.5);

        // 3) block keeps moving right and uncovers the text
        tl.to(block,
            { scaleX: 0, duration: 0.5, ease: "power3.inOut" },
            t + 0.5
        );
    });
});