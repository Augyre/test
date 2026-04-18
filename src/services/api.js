import axios from "axios";

const url_api = 'https://app.tablecrm.com/api/v1';


class TableApi {
    constructor(token) {
        this.token = token;
        this.client = axios.create({
            baseURL: url_api,
            params: { token: this.token }
        })
    }

    async getClients() {
        const resp = await this.client.get('/contragents/')
        return resp.data
    }

    async getWarehouses() {
        const resp = await this.client.get('/warehouses/')
        return resp.data
    }

    async getPboxes() {
        const resp = await this.client.get('/payboxes/')
        return resp.data
    }

    async getOrganizations() {
        const resp = await this.client.get('/organizations/')
        return resp.data
    }

    async getPriceType() {
        const resp = await this.client.get('/price_types/')
        return resp.data
    }

    async getNomenclature() {
        const resp = await this.client.get('/nomenclature/')
        return resp.data
    }

    async createSale(orderData) {
        try {
            const resp = await this.client.post('/docs_sales/', orderData);
            return resp.data;
        } catch (error) {
            console.error('Ошибка создания продажи:', error);
            throw error;
        }
    }
}

export default TableApi