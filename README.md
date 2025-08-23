# Cryptocurrency Liquidity Dashboard

This project is a real-time visualization of cryptocurrency liquidity flows and market dynamics, presenting a dynamic network of nodes and connections that represent crypto assets and the flow of liquidity between them.

## Features

-   **Real-time Visualization**: Displays a dynamic graph of cryptocurrency assets and their connections.
-   **Node Representation**: Each node represents a specific cryptocurrency asset, showing its current status through color-coding.
-   **Liquidity Flow**: Connections between nodes visualize the flow of liquidity, indicating direction and volume.
-   **Interactive Tooltips**: Hover over any node to get detailed information about the asset.
-   **Node Selection**: Click on nodes to select them and highlight their immediate connections, helping to trace liquidity paths.
-   **Cascade Effect**: Significant changes in market data trigger a "cascade" visual effect, highlighting volatile events.
-   **Dynamic Legend**: An on-screen legend explains the color-coding for node statuses (e.g., growing, declining, stable) and connection types.
-   **Live Data Simulation**: The dashboard simulates live data updates to mimic a real-world environment.

## Tech Stack

-   **React**: A JavaScript library for building user interfaces.
-   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
-   **Vite**: A fast build tool and development server for modern web projects.
-   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
-   **Lucide React**: A library of simply designed, beautiful icons.

## Installation

To get a local copy up and running, follow these simple steps.

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/blotchain-liquidity-dashboard.git
    ```
2.  Navigate to the project directory
    ```sh
    cd blotchain-liquidity-dashboard
    ```
3.  Install NPM packages
    ```sh
    npm install
    ```

## Usage

To start the development server, run the following command:

```sh
npm run dev
```

This will open the application in your default browser at `http://localhost:5173` (or the next available port).
