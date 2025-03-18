import { useEffect, useState, useRef } from "react";
import { solana_wallet_services } from "../api/services";
import { MoonLoader } from "react-spinners";
import  axios  from "axios";

const Analyzer = ({ address }) => {
    const [assets, setAssets] = useState({}); // Initialize as an object
    const [tx, setTx] = useState([])
    const [tokenPurchased, setTokenPurchased] = useState([])
    const [tokenNames, setTokenNames] = useState({});
    const processedSignaturesRef = useRef(new Set()); 
    const [pnl, setPnl] = useState({})
    const [isLoading, setIsLoading] = useState(true);
    

    useEffect(() => {
        const getAssets = async () => {
            try {
                const data = await solana_wallet_services.getAssets(address); // Await the async call
                
                setAssets(data || {}); // Fallback to an empty object if data is undefined
                setIsLoading(true)
                
            } catch (error) {
                console.error("Error fetching assets:", error);
            } finally {
                setIsLoading(false)
            }
        };

        getAssets();
    }, [address]);

    useEffect(() => {
        const getTransactions = async () => {
            try {
                const data = await solana_wallet_services.getTransactions(address); // Await the async call
                
                setTx(data || {}); // Fallback to an empty object if data is undefined
                setIsLoading(true)
            } catch (error) {
                console.error("Error fetching assets:", error);
            } finally {
                setIsLoading(false)
            }
        };

        getTransactions();
    }, [address]);

    const tokens = assets.items
        ? Object.values(assets.items)
              .filter(item => item.interface === "FungibleToken")
              .map(item => {

                const decimals = item.token_info?.decimals   
                const rawBalance = item.token_info?.balance || 0; // Fallback for balance
                const uiAmount = rawBalance / Math.pow(10, decimals)
                return {
                    name: item.content?.metadata?.name || "Unknown", // Fallback for name
                    amount: uiAmount.toFixed(0),
                    pics: item.content.links.image
                };
            })
        : []; // Return an empty array if assets.items is undefined

    const sigs = tx
              .filter(t => t.feePayer === address)
              .map(t => t.signature)
   
    console.log(sigs)

    useEffect(() => {

        //skip if no signatures
        if (sigs.length === 0) return;

        //create a signature hash to check if the we,ve processed these exact signatures
        const sigsHash = JSON.stringify(sigs.sort())

        //skip if we've have already processed the signatures
        if(processedSignaturesRef.current.has(sigsHash)) return;

        const getTokenPurchases = async () => {
            try {
                processedSignaturesRef.current.add(sigsHash)

                const purchases = [];
                setIsLoading(true)

                // process each signature
                for (const signature of sigs){
                    const txData = await solana_wallet_services.getTokenData(signature);

                    //find new token 
                    const newTokens = txData.meta.postTokenBalances.filter(post => 
                        !txData.meta.preTokenBalances.some(pre => 
                            pre.accountIndex === post.accountIndex
                        )
                    )

                    for (const token of newTokens) {
                        const purchase = {
                            time: new Date(txData.blockTime * 1000).toLocaleString(),
                            tokenMint: token.mint,
                            amount: token.uiTokenAmount.uiAmount,
                            signature: signature

                        };
                        purchases.push(purchase)
                    }
                }

                setTokenPurchased(purchases)
                
                // Fetch token names for all purchases
                const mintAddresses = [...new Set(purchases.map(p => p.tokenMint))];
                const names = {};
                
                for (const mint of mintAddresses) {
                    try {
                        const response = await axios.get(`https://api.jup.ag/tokens/v1/token/${mint}`);
                        console.log(response.data)
                        names[mint] = response.data.name || "Unknown Token";
                    } catch (error) {
                        console.error(`Error fetching token info for ${mint}:`, error);
                        names[mint] = "Unknown Token";
                    }
                }
                
                setTokenNames(names);

                //fetch price and pnl
                const timeBlocks = [...new Set(purchases.map(p => {
                    const date = new Date(p.time)
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear()

                    return `${day}-${month}-${year}`
                }))];
                


                
                const history = {}
                for (const mint of mintAddresses) {
                    for (const time of timeBlocks) {
                        
                        try {
                            const coinId = names[mint].toLowerCase();
            
                            const history_response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${time}`)
                            const history_price = history_response.data.market_data.current_price.usd
                            console.log("history says", history_response.data.market_data.current_price.usd)
                            const current_response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`)
                            console.log("current data says: ", current_response.data.market_data.current_price.usd);
                            const current_price = current_response.data.market_data.current_price.usd
                            const total = current_price - history_price
                            history[mint] = total
                            setPnl(history)
                            console.log(history)
                            

                        } catch (error) {
                            console.error(error)
                        }
                    }
                   
                }
            } catch(error) {
                console.error("Error analyzing token purchases:", error)
            } finally {
                setIsLoading(false)
            }

        }

        getTokenPurchases()
    }, [sigs])

    

    return (
        <section className="bg-gradient-to-r from-purple-900 to-green-900  h-min-screen h-max-full text-white p-6 flex flex-col  items-center ">
            {isLoading ? <MoonLoader color="#36d7b7" size={50} /> 
            : <div>
                    <h1 className="font-bold text-xl mb-3 text-center ">Assets</h1>
                
                <div> {tokens.length > 0 ? (
                    tokens.map((token, index) => (
                    
                        <p key={index} className="flex flex-row items-center border-b rounded p-2">
                            <img 
                                src={token.pics} alt="token image" 
                                className="w-10 h-10 rounded-4xl mr-2" 
                            /> 
                            {token.name}: <span className="font-bold ml-2">{token.amount}</span>
                        </p>
                    ))
                ) : (
                    <p>No tokens found</p>
                )} </div>
                <div className="mt-4">
                    <h2 className="text-xl font-bold text-center">Token Purchases</h2>
                    {tokenPurchased.length > 0 ? (
                        tokenPurchased.map((purchase, index) => (
                            <div key={index} className="my-2 p-2 border-b rounded">
                                <p className="mb-1">Time: {purchase.time}</p>
                                <p className="mb-1">Token: {tokenNames[purchase.tokenMint]}</p>
                                <p className="mb-1">Amount: {purchase.amount.toFixed(0)}</p>
                                <p >PNL: <span className={`${parseFloat(pnl[purchase.tokenMint]) > 0 ? 'text-green-600' : 'text-red-600' } font-bold`}>${(pnl[purchase.tokenMint] * purchase.amount).toFixed(0)}</span></p>
                                {console.log('PNL value:', pnl[purchase.tokenMint], 'Parsed:', parseFloat(pnl[purchase.tokenMint]))
                                }
                                
                            </div>
                        ))
                    ) : (
                        <p>No purchases found</p>
                    )}
                </div>
            </div>}

           
        </section>
    );
};

export default Analyzer;

