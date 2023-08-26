import * as dotenv from 'dotenv'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {WebSocket} from 'ws';

dotenv.config()
const regions = ['eu-north-1', 'ap-southeast-1']

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getParameters = async () => {
  const command = new ScanCommand({
    TableName: "vol_params",
  });

  let parameter = undefined

  const response = await docClient.send(command);
  if(response && response.Items){
    const btcParams = (response.Items.filter((item) => item.ticker === 'btc'))
    if(btcParams.length > 0){
      parameter = btcParams[0]
    }
  }

  return parameter;
}

const writeForecast = async (params) => {
  const command = new PutCommand({
    TableName: "forecast",
    Item: { ...params },
  });

  return docClient.send(command);
}

export const main = async () => {

  const ws = new WebSocket('wss://api.coinmetrics.io/v4/timeseries-stream/asset-metrics?api_key=grlbZNpbW4WL3JhrPRPt&assets=btc&frequency=1s&metrics=ReferenceRateUSD');

  ws.on('message', async (data) => {
    const parameter = await getParameters()
    const message = JSON.parse(data as unknown as string)


    if(parameter){
      const forecast_data = {
        id: `${message.time}-${process.env.AWS_REGION}`,
        phi2: +parameter['phi2'] * +message.ReferenceRateUSD,
        alpha0: parameter['phi2'] * +message.ReferenceRateUSD * 2,
        phi1: parameter['phi2'] * +message.ReferenceRateUSD * 3,
        ticker: 'btc',
        alpha1: parameter['phi2'] * +message.ReferenceRateUSD * 3,
        alpha2: parameter['phi2'] * +message.ReferenceRateUSD * 4,
        beta2: parameter['phi2'] * +message.ReferenceRateUSD * 5,
        beta1: parameter['phi2'] * +message.ReferenceRateUSD * 6,
        a0: parameter['phi2'] * +message.ReferenceRateUSD * 7,
        b1: parameter['phi2'] * +message.ReferenceRateUSD * 8,
        a1: parameter['phi2'] * +message.ReferenceRateUSD * 9,
        b2: parameter['phi2'] * +message.ReferenceRateUSD * 10,
        sum_ab: parameter['phi2'] * +message.ReferenceRateUSD * 11,
        a2: parameter['phi2'] * +message.ReferenceRateUSD * 12,
        lev1: parameter['phi2'] * +message.ReferenceRateUSD * 13,
        lev2: parameter['phi2'] * +message.ReferenceRateUSD * 14,
      }

      await writeForecast(forecast_data)
      console.log('added')
    }





  });

};

 main().catch((e) => console.log(e))



