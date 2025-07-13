# 🚴 Hill Cruze: Downhill Madness

A fast-paced, side-scrolling downhill biking game set in the vibrant terrains of Africa. Dodge obstacles, grab power-ups, and race for the highest score!

## Table of Contents

1.  [Gameplay](#gameplay)
2.  [How to Play](#how-to-play)
3.  [Features](#features)
4.  [Project Structure](#project-structure)
5.  [Getting Started](#getting-started)
6.  [Scalability & Design](#scalability--design)

---

### Gameplay

**Hill Cruze** is an endless runner where you control a cyclist navigating a procedurally generated, bumpy terrain. The goal is to survive as long as possible while collecting points.

-   **Progressive Difficulty**: The game gets faster and obstacles appear more frequently the farther you travel.
-   **Stamina Management**: Use your stamina to accelerate, but be careful! Running out will leave you slow and vulnerable.
-   **Power-Ups**: Collect three types of power-ups to aid your run:
    -   🚀 **Speed Boost**: A temporary burst of speed.
    -   💉 **Energy Refill**: Instantly replenishes your stamina over time.
    -   🛡️ **Shield**: Protects you from a single obstacle collision.

---

### How to Play

The controls are simple and intuitive for both desktop and mobile.

**Desktop Controls:**
-   **Steer Left:** `←` (Left Arrow) or `A`
-   **Steer Right:** `→` (Right Arrow) or `D`
-   **Jump:** `↑` (Up Arrow) or `W` or `Space`
-   **Duck:** `↓` (Down Arrow) or `S`

**Mobile Controls:**
-   Use the on-screen touch controls for steering, jumping, and ducking.

---

### Features

-   **Persistent High Score**: Your highest score is saved locally in your browser using `localStorage`.
-   **Responsive Design**: A clean UI that adapts to both desktop and mobile screens.
-   **Dynamic Sound**: Simple, synthesized audio feedback for key actions.
-   **Modular Code**: Separated HTML, CSS, and JavaScript files for easy maintenance and scalability.
-   **Zero Dependencies**: Runs in any modern web browser with no external libraries required.

---

### Project Structure

The codebase is organized into clear, distinct files to promote scalability and readability.