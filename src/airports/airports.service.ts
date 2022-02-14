import { Context } from "fabric-contract-api";
import { Airport } from "./airport";

export class AirtportsService {
    private ctx: Context;

    constructor(ctx) {
        this.ctx = ctx;
    }

    async exists(airportId: string) {
        const airportBuffer = await this.ctx.stub.getState(airportId);
        if (airportBuffer && airportBuffer.length > 0) return true;
        return false;
    }

    async get(airportId: string) {
        const airportBuffer = await this.ctx.stub.getState(airportId)
        return JSON.parse(airportBuffer.toString())
    }

    async create(airportId: string, name: string, location: string) {
        if (await this.exists(airportId)) {
            throw new Error(`Airport ${airportId} already exists`);
        }

        let airport = new Airport(name, location);

        // db.pudState(airlineId, airline)

        const airportBuffer = Buffer.from(JSON.stringify(airport));

        await this.ctx.stub.putState(airportId, airportBuffer);
    }
    public async updatename(airportId: string, newname: string) {
        let airport = await this.get(airportId)
        airport.name = newname

        const airportBuffer = Buffer.from(JSON.stringify(airport))

        await this.ctx.stub.putState(airportId, airportBuffer)
    }

    public async updatelocation(airportId: string, newlocation: string) {
        let airport = await this.get(airportId)
        airport.location = newlocation
        const airportBuffer = Buffer.from(JSON.stringify(airport))

        await this.ctx.stub.putState(airportId, airportBuffer)
    }

    async delete(orderId: string) {
        await this.ctx.stub.deleteState(orderId)
    }
}
