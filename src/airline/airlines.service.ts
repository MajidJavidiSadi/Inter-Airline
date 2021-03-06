import { Context } from "fabric-contract-api";
import { Airline } from "./airline";

export class AirlinesService {
    private ctx: Context

    constructor(ctx: Context) {
        this.ctx = ctx
    }

    async exists(airlineId: string): Promise<boolean> {
        const airlineBuffer = await this.ctx.stub.getState(airlineId)
        if (airlineBuffer && airlineBuffer.length > 0) return true
        return false
    }

    async get(airlineId: string): Promise<Airline> {
        const airlineBuffer = await this.ctx.stub.getState(airlineId)
        const airline = JSON.parse(airlineBuffer.toString())
        return airline
    }

    async create(airlineId: string, name: string, country: string) {
        if (this.exists(airlineId)) {
            throw new Error(`Airline ${airlineId} already exists`)
        }

        const airline = new Airline(name, country)

        const airlineBuffer = Buffer.from(JSON.stringify(airline))

        await this.ctx.stub.putState(airlineId, airlineBuffer)
    }
    public async updatename(airlineId: string, newname: string) {
        let airline = await this.get(airlineId)
        airline.name = newname

        const airlineBuffer = Buffer.from(JSON.stringify(airline))

        await this.ctx.stub.putState(airlineId, airlineBuffer)
    }

    public async updatecountry(airlineId: string, newcountry: string) {
        let airline = await this.get(airlineId)
        airline.country = newcountry
        const arilinetBuffer = Buffer.from(JSON.stringify(airline))

        await this.ctx.stub.putState(airlineId, arilinetBuffer)
    }

    async delete(airlineId: string) {
        await this.ctx.stub.deleteState(airlineId)
    }
}