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

3. Configure the `.env` file:

    Create a `.env` file in the `frontend` directory with the following variables:

    ```.env
    INFURA_API_KEY=your_infura_api_key_here
    ACCOUNT_PRIVATE_KEY=your_private_key_here
    ```

    **Note:**
    - The `ACCOUNT_PRIVATE_KEY` is used for deploying contracts. Make sure this account has MATIC tokens from the [Polygon Faucet](https://faucet.polygon.technology/).
    - The **INFURA_API_KEY** is required to connect to the Polygon network via Infura. You can obtain this by creating an account at [Infura](https://app.infura.io/).

## Usage

1. Start the development server:

    ```bash
    npm start
    ```

2. Open your browser and go to `http://localhost:9000`.

3. The application will display the current gas prices on the Polygon Amoy testnet.

## Features

- **Fetch Gas Prices**: Retrieve live gas prices (fast, standard, safeLow) from the Polygon Amoy testnet Gas Station.
- **Select Gas Price for Contract Deployment**: Users can choose a gas price (fast, standard, or safeLow) to deploy an ERC20 contract and mint tokens.
- **Real-time Updates**: Gas prices are updated automatically at regular intervals.
