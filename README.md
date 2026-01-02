# Koenig-D'Amico RPO Mission Planner

A web-based spacecraft Rendezvous and Proximity Operations (RPO) mission planning tool with interactive 3D visualization.

**[Live Demo](https://koenig-damico-roe-rpo.netlify.app/)**

## Overview

This application enables mission planning for spacecraft formation flying and proximity operations in Low Earth Orbit. It combines a rigorous orbital mechanics library with an intuitive 3D interface, allowing users to:

- Visualize spacecraft relative motion in the RIC (Radial-Intrack-Crosstrack) coordinate frame
- Plan multi-waypoint rendezvous missions with automatic trajectory computation
- Model realistic orbital perturbations including J2 (Earth oblateness) and atmospheric drag
- Play back computed trajectories with real-time telemetry display

## Theoretical Background

The orbital mechanics engine implements the framework from:

> **"New State Transition Matrices for Spacecraft Relative Motion in Perturbed Orbits"**
> Adam W. Koenig, Tommaso Guffanti, and Simone D'Amico
> _Journal of Guidance, Control, and Dynamics_, 2017

### Key Concepts

**Relative Orbital Elements (ROE):** The application uses quasi-nonsingular ROE to describe the deputy spacecraft's orbit relative to the chief. This 6-element state vector captures relative semi-major axis, mean longitude, eccentricity, and inclination — enabling efficient propagation and targeting.

**State Transition Matrices (STM):** Three propagation models are available:

- _Keplerian_: Unperturbed two-body motion
- _J2-Perturbed_: Includes secular effects from Earth's oblateness (nodal regression, apsidal precession)
- _J2 + Drag_: Adds density-model-free atmospheric drag effects

**Two-Burn Rendezvous:** The targeting algorithm computes optimal impulsive maneuvers using an iterative shooting method with the control influence matrix derived from the Gauss Variational Equations. For implementation details, see [TARGETING.md](./TARGETING.md).

## Features

### 3D Visualization

- Chief spacecraft fixed at origin, deputy animated along trajectory
- Interactive waypoint placement with drag-to-edit
- Trajectory path rendering with dashed line visualization
- RIC coordinate axes gizmo for orientation reference
- Responsive zoom scaling for formations from meters to kilometers

### Mission Planning

- Click to place waypoints in 3D space
- Automatic multi-leg trajectory computation
- Incremental replanning when waypoints are modified
- Per-leg and total delta-v reporting

### Physics Configuration

- Toggle J2 perturbation effects
- Toggle atmospheric drag modeling with configurable decay rates
- Multiple pre-configured scenarios:
  - ISS Circular (~400 km altitude)
  - High-Altitude Eccentric (e = 0.1)
  - Low-Altitude Eccentric
  - Long-Duration Hold
  - Large Formation (10+ km separations)

### Simulation Playback

- Play/pause with variable speed (1x to 500x)
- Timeline scrubbing to any mission point
- Real-time HUD displaying position, velocity, and metrics

### Data Export

- **JSON Export**: Complete mission data including chief orbit, waypoints with ROE, leg details, and burn timing
- **CSV Export**: Time-series trajectory with interleaved maneuver events (departure/arrival burns with delta-v vectors)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sakobu/koenig-guffanti-damico-roe-stm.git
cd koenig-damico-rpo

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 19** + **TypeScript** — UI framework with type safety
- **React Three Fiber** + **Three.js** — 3D rendering
- **Zustand** — Lightweight state management
- **Tailwind CSS** — Styling
- **Vite** — Build tooling

## Project Structure

```
src/
├── orbital/          # Astrodynamics library
│   ├── stm/          # State Transition Matrices (Keplerian, J2, drag)
│   ├── propagation/  # ROE propagation engine
│   ├── targeting/    # Rendezvous solver & mission planner
│   ├── transforms/   # ROE ↔ RIC coordinate conversions
│   └── math/         # Kepler utilities, orbital factors
│
├── components/
│   ├── canvas/       # 3D scene (spacecraft, trajectory, waypoints)
│   └── ui/           # Sidebar, HUD, panels
│
├── stores/           # Zustand stores (mission, simulation, UI)
├── hooks/            # Custom React hooks
├── config/           # Scenario definitions
└── utils/            # Coordinate transforms, formatting
```

## References

- Koenig, A. W., Guffanti, T., & D'Amico, S. (2017). _New State Transition Matrices for Spacecraft Relative Motion in Perturbed Orbits_. Journal of Guidance, Control, and Dynamics, 40(7), 1749-1768.

- D'Amico, S. (2010). _Autonomous Formation Flying in Low Earth Orbit_. PhD Thesis, TU Delft.

## License

MIT
