import axios from 'axios'

const api = axios.create({
    baseURL: 'https://solana-wallet-tracker-backend.onrender.com',
    headers: {
        'Content-Type': 'application/json'
    }
})

export const solana_wallet_services = {

    getAssets: async (address) => {

        try {
            const response = await api.get(`/getassets/${address}`)
            return response.data

        } catch(error) {
            throw new Error(error.message)

        }
    }, 

    getTransactions: async (address) => {

        try {
            const response = await api.get(`/transactions/${address}`)
            return response.data

        } catch(error) {
            throw new Error(error.message)

        }
    },

    getTokenData: async (signature) => {
        try {

            const response = await api.get(`/test/${signature}`)
            return response.data

        } catch(error) {
            throw new Error(error.message)
        }
    }
}