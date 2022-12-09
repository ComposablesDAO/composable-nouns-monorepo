import { Handler } from '@netlify/functions';
import { nounsQuery, Seed } from '../theGraph';
import * as R from 'ramda';
import { sharedResponseHeaders } from '../utils';
import { connect } from '@planetscale/database';
import { fetch } from 'undici';

const configIndexer = {
	fetch,
	host: process.env.REACT_APP_DATABASE_HOST,
	username: process.env.REACT_APP_DATABASE_USERNAME,
	password: process.env.REACT_APP_DATABASE_PASSWORD
}

const handler: Handler = async (event, context) => {
	
  const queryParams = event.queryStringParameters;
  const tokenAddress = queryParams['address'];
  
  const conn = connect(configIndexer);
  const results = await conn.execute('SELECT tokenAddress, bannerImage FROM collections WHERE tokenAddress = ?', [tokenAddress]);
  
  let pngBase64 = null;
  if (results.rows.length > 0) {
  	const row: Record<string, any> = results.rows[0];
  	
  	if (row && row.bannerImage && row.bannerImage !== '' ) {
  		pngBase64 = row.bannerImage;
  	}
  }  
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      ...sharedResponseHeaders,
    },
    body: pngBase64,
    isBase64Encoded: true,
  };
};

export { handler };
