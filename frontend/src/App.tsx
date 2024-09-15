import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { Container, Box, Card, CardContent, Stack, Divider, Typography, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

// MyToken.json から ABI とバイトコードをインポート
import myTokenContract from './contracts/MyToken.json';

// Polygon Gas Station APIエンドポイント
const GAS_STATION_URL = 'https://gasstation.polygon.technology/amoy';

// 選択肢
const GAS_PRICES = {
  FAST: 'fast',
  STANDARD: 'standard',
  SAFE_LOW: 'safeLow',
};

const App: React.FC = () => {
  const [gasPrices, setGasPrices] = useState<any>(null);
  const [contractData, setContractData] = useState<{ abi: any; bytecode: string } | null>(null);
  const [txReceipt, setTxReceipt] = useState<any>(null);
  const [deployTime, setDeployTime] = useState<string | null>(null);
  const [gasPrice, setGasPrice] = useState<string>(GAS_PRICES.STANDARD); // デフォルトを 'standard' に設定
  const [deployLoading, setDeployLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGasPriceChange = (e: SelectChangeEvent<string>) => {
    const selectedGasPrice = e.target.value as string;
    setGasPrice(selectedGasPrice);
  };

  const handleDeployContract = async () => {
    setDeployLoading(true);
    setError(null);

    if (!contractData) {
      setDeployLoading(false);
      setError('Contract data is not loaded.');
      return;
    }

    try {
      // 選択されたガス価格に応じたガス代を取得
      let selectedMaxFee;
      let selectedMaxPriorityFee;
      switch (gasPrice) {
        case GAS_PRICES.FAST:
          selectedMaxFee = gasPrices.fast.maxFee;
          selectedMaxPriorityFee = gasPrices.fast.maxPriorityFee;
          break;
        case GAS_PRICES.SAFE_LOW:
          selectedMaxFee = gasPrices.safeLow.maxFee;
          selectedMaxPriorityFee = gasPrices.safeLow.maxPriorityFee;
          break;
        case GAS_PRICES.STANDARD:
        default:
          selectedMaxFee = gasPrices.standard.maxFee;
          selectedMaxPriorityFee = gasPrices.standard.maxPriorityFee;
          break;
      }

      // ガス代を gwei から wei に変換
      const maxFeePerGas = ethers.parseUnits(selectedMaxFee.toString(), 'gwei');
      const maxPriorityFeePerGas = ethers.parseUnits(selectedMaxPriorityFee.toString(), 'gwei');

      // プロバイダーとウォレットをセットアップ
      const infuraApiKey = process.env.INFURA_API_KEY;
      if (!infuraApiKey) {
        throw new Error('INFURA_API_KEY is not defined in environment variables');
      }
      const providerUrl = `https://polygon-amoy.infura.io/v3/${infuraApiKey}`;
      const provider = new ethers.JsonRpcProvider(providerUrl);
      const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ACCOUNT_PRIVATE_KEY must be set in the environment variables');
      }
      const wallet = new ethers.Wallet(privateKey, provider);

      // ウォレットのアドレスをオーナーアドレスとして使用
      const ownerAddress = wallet.address;

      // コントラクトのファクトリを作成
      const contractFactory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, wallet);

      // デプロイトランザクションのデータを作成
      const deployTx = contractFactory.getDeployTransaction(ownerAddress);

      // ガスの見積もりを取得
      /*
      const gasEstimate = await provider.estimateGas({
        data: deployTx.data,
        from: wallet.address,
      });
      */

      // デプロイ開始時の時間を記録
      const startTime = Date.now();

      // コントラクトのデプロイを実行
      const contract = await contractFactory.deploy(
        ownerAddress, 
        {
          maxFeePerGas: maxFeePerGas, // 選択されたガス価格を使用
          maxPriorityFeePerGas: maxPriorityFeePerGas,
//          gasLimit: gasEstimate // 見積もられたガスリミットを使用
        }
      );

      // コントラクトがデプロイされるのを待機
      await contract.waitForDeployment();

      const receipt = await contract.deploymentTransaction()!.wait();
      setTxReceipt(receipt);

      // デプロイ完了時の時間を記録
      const endTime = Date.now();

      // 使用したガスとガス代を計算
      const totalGasCost = BigInt(receipt!.gasUsed) * BigInt(receipt!.gasPrice); // ガス使用量 × 実際のガス価格

      // 時間差を秒で計算
      const deployTime = (endTime - startTime) / 1000;
      setDeployTime(deployTime.toString());

      console.log(`contract address: ${receipt!.contractAddress}`);
      console.log(`transaction hash: ${receipt!.hash}`);
      console.log(`gas used: ${receipt!.gasUsed.toString()}`);
      console.log(`gas price: ${ethers.formatUnits(receipt!.gasPrice, 'gwei')} Gwei`);
      console.log(`total fee: ${ethers.formatEther(receipt!.fee.toString())} ETH`);
      console.log(`total cost: ${ethers.formatEther(totalGasCost.toString())} ETH`);
      console.log(`deploy time: ${deployTime} sec`);
  } catch (error) {
    console.error('Contract deployment failed. Please try again.', error);
    setError('Contract deployment failed. Please try again.');
    setDeployLoading(false);
  } finally {
    setDeployLoading(false);
  }
}

  useEffect(() => {
    const fetchGasPrices = async () => {
      try {
        const response = await axios.get(GAS_STATION_URL);
        setGasPrices(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching gas prices:', error);
        setError('Error fetching gas prices');
      }
    };

    // 初回のガス料金取得
    fetchGasPrices();

    // 10秒ごとにガス料金を取得
    const interval = setInterval(() => {
      fetchGasPrices();
    }, 10000); // 10秒間隔

    // コンポーネントのアンマウント時にインターバルをクリア
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // MyToken.json から ABI とバイトコードをセット
    const loadContractData = () => {
      const abi = myTokenContract.abi;
      const bytecode = myTokenContract.bytecode;
      setContractData({ abi, bytecode });
    };

    loadContractData();
  }, []);

  if (!gasPrices) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5 }}>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h4">Polygon Gas Prices</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Fast</Typography>
                  <Typography variant="body2" color="textSecondary">Max Fee:</Typography>
                  <Typography variant="body1">{gasPrices.fast.maxFee} Gwei</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary">Max Priority Fee:</Typography>
                  <Typography variant="body1">{gasPrices.fast.maxPriorityFee} Gwei</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6">Standard</Typography>
                  <Typography variant="body2" color="textSecondary">Max Fee:</Typography>
                  <Typography variant="body1">{gasPrices.standard.maxFee} Gwei</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary">Max Priority Fee:</Typography>
                  <Typography variant="body1">{gasPrices.standard.maxPriorityFee} Gwei</Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6">Safe Low</Typography>
                  <Typography variant="body2" color="textSecondary">Max Fee:</Typography>
                  <Typography variant="body1">{gasPrices.safeLow.maxFee} Gwei</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary">Max Priority Fee:</Typography>
                  <Typography variant="body1">{gasPrices.safeLow.maxPriorityFee} Gwei</Typography>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h4">Deploy Contract</Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="gas-price-label">Gas Price</InputLabel>
              <Select
                labelId="gas-price-label"
                value={gasPrice}
                onChange={handleGasPriceChange}
                label="Gas Price"
              >
                <MenuItem value={GAS_PRICES.FAST}>Fast</MenuItem>
                <MenuItem value={GAS_PRICES.STANDARD}>Standard</MenuItem>
                <MenuItem value={GAS_PRICES.SAFE_LOW}>Safe Low</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={handleDeployContract} sx={{ mt: 2}} disabled={deployLoading}>
              {deployLoading ? <CircularProgress size={24} /> : 'Deploy Contract'}
            </Button>
            {(txReceipt && deployTime) && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    Contract Address: <Typography component="span" variant="body1" color="textPrimary">
                      {txReceipt.contractAddress}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Transaction Hash: <Typography component="span" variant="body1" color="textPrimary">
                      {txReceipt.hash}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Gas Used: <Typography component="span" variant="body1" color="textPrimary">
                      {txReceipt.gasUsed.toString()}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Gas Price: <Typography component="span" variant="body1" color="textPrimary">
                      {ethers.formatUnits(txReceipt.gasPrice, 'gwei')} Gwei
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Fee: <Typography component="span" variant="body1" color="textPrimary">
                      {ethers.formatEther(txReceipt.fee.toString())} ETH
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Deploy Time: <Typography component="span" variant="body1" color="textPrimary">
                      {deployTime} sec
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default App;
