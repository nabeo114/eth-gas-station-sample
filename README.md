# Eth Gas Station Sample

## Overview

`eth-gas-station-sample` is a sample project that demonstrates how to retrieve and display gas prices from the [Polygon Amoy testnet Gas Station](https://gasstation.polygon.technology/amoy). The project fetches current gas prices on the Polygon Amoy testnet and provides an interface to visualize the different gas price tiers (fast, standard, safeLow).

For more details about the Polygon Gas Station, refer to the official documentation [here](https://docs.polygon.technology/tools/gas/polygon-gas-station/).


## Installation

To run this project locally, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/nabeo114/eth-gas-station-sample.git
    cd eth-gas-station-sample
    ```

2. Install the required dependencies:

    ```bash
    cd frontend
    npm install
    ```

## Usage

1. Start the development server:

    ```bash
    npm start
    ```

2. Open your browser and go to `http://localhost:9000`.

3. The application will display the current gas prices on the Polygon Amoy testnet.

## Features

- **Fetch Gas Prices**: Retrieve live gas prices (fast, standard, safeLow) from the Polygon Amoy testnet Gas Station.
- **Select Gas Price for Contract Deployment**: Users can select a gas price (fast, standard, or safeLow) to deploy an ERC20 contract and mint tokens.
- **Real-time Updates**: Automatically fetch and update the gas prices at regular intervals.
