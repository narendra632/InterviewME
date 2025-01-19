import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/LandingPage.css';

const End = () => {
  const navigate = useNavigate();

  

  useEffect(() => {
    let index = 0;
    const interval = 1000;

    const rand = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const animate = (star) => {
      star.style.setProperty("--star-left", `${rand(-10, 100)}%`);
      star.style.setProperty("--star-top", `${rand(-40, 80)}%`);

      star.style.animation = "none";
      star.offsetHeight; // Trigger reflow
      star.style.animation = "";
    };

    const stars = document.getElementsByClassName("magic-star");
    for (const star of stars) {
      setTimeout(() => {
        animate(star);
        setInterval(() => animate(star), interval);
      }, index++ * (interval / 3));
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {/* Top Left Corner Branding */}
      <div className="absolute top-4 left-6">
        <h1 className="text-xl md:text-2xl font-bold font-sans tracking-wide">
          Interview<span className="text-blue-400">.AI</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="content text-center px-4">
        <h1 className="text-3xl md:text-3xl font-bold leading-snug relative">
            Thank you for attending the interview. Your report has been sent to you and HR.<br />
          <span className="magic">
            <span className="magic-star">
              <svg viewBox="0 0 512 512">
                <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
              </svg>
            </span>
            <span className="magic-star">
              <svg viewBox="0 0 512 512">
                <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
              </svg>
            </span>
            <span className="magic-text">Our team will contact you for the next steps if you are the desired candidate.</span>
          </span>
        </h1>

      </div>
    </div>
  );
};

export default End;