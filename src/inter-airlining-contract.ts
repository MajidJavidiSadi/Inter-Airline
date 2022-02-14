/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Context,
    Contract,
    Info,
    Returns,
    Transaction,
} from "fabric-contract-api";
import { AirlinesService } from "./airline/airlines.service";
import { AirtportsService } from "./airports/airports.service";
import { Baggage } from "./baggage/baggage";
import { BaggageService } from "./baggage/baggage.service";
import { Order, OrderStatusEnum } from "./order/order";
import { OrderService } from "./order/order-service";

// ToDo Test before/afterTransaction logs using fabric samples network
// ToDo implement and test transaction methods
@Info({ title: "InterAirliningContract", description: "My Smart Contract" })
export class InterAirliningContract extends Contract {
    public async beforeTransaction(ctx: Context): Promise<void> {
        // IDxxx called fn: funcName, params: ...
        const { fcn: methodName, params: methodParms } =
            ctx.stub.getFunctionAndParameters();
        const id = ctx.clientIdentity.getID();
        const mspId = ctx.clientIdentity.getMSPID();

        console.log(
            `Function: ${methodName}, Params: ${methodParms} Called by Id: ${id} From ${mspId}`
        );
    }

    public async afterTransaction(ctx: Context, result: any): Promise<void> {
        console.log(`Result: ${result}`);
    }

    @Transaction(false)
    @Returns("boolean")
    public async baggageExists(
        ctx: Context,
        baggageId: string
    ): Promise<boolean> {
        const baggageService = new BaggageService(ctx);
        return await baggageService.exists(baggageId);
    }

    @Transaction(false)
    @Returns("Baggage")
    public async getBaggage(ctx: Context, baggageId: string): Promise<Baggage> {
        const baggageService = new BaggageService(ctx);
        const baggage = await baggageService.get(baggageId);
        return baggage;
    }

    @Transaction(true)
    public async createBaggage(
        ctx: Context,
        baggageId: string,
        owner: string,
        weight: string,
        value: string
    ) {
        const baggageService = new BaggageService(ctx);
        await baggageService.create(baggageId, owner, weight, value);
        // events tx
        const eventData = { baggageId, owner, weight, value };
        ctx.stub.setEvent(
            "BaggageCreated",
            Buffer.from(JSON.stringify(eventData))
        );
    }

    @Transaction(true)
    public async updateBaggageOwner(
        ctx: Context,
        baggageId: string,
        newOwner: string
    ) {
        const baggageService = new BaggageService(ctx);
        await baggageService.updateOwner(baggageId, newOwner);
    }

    @Transaction(true)
    public async updateBaggageValue(
        ctx: Context,
        baggageId: string,
        newValue: string
    ) {
        const baggageService = new BaggageService(ctx);
        await baggageService.updateValue(baggageId, newValue);
    }

    @Transaction(true)
    public async updateBaggageWeight(
        ctx: Context,
        baggageId: string,
        newWeight: string
    ) {
        const baggageService = new BaggageService(ctx);
        await baggageService.updateWeight(baggageId, newWeight);
    }

    @Transaction(true)
    public async deleteBaggage(ctx: Context, baggageId: string) {
        const baggageService = new BaggageService(ctx);
        await baggageService.delete(baggageId);
    }

    @Transaction(true)
    public async createAirline(
        ctx: Context,
        airlineId: string,
        name: string,
        country: string
    ) {
        const airline = new AirlinesService(ctx);
        await airline.create(airlineId, name, country);
    }

    @Transaction(true)
    public async createAirport(
        ctx: Context,
        airportId: string,
        name: string,
        location: string
    ) {
        const airport = new AirtportsService(ctx);
        await airport.create(airportId, name, location);
    }

    @Transaction(true)
    public async createOrder(
        ctx: Context,
        orderId: string,
        baggageId: string,
        srcAirportId: string,
        dstAirportId: string,
        airlineId: string,
        flightNo: string
    ) {
        const orderService = new OrderService(ctx);
        await orderService.create(
            orderId,
            baggageId,
            srcAirportId,
            dstAirportId,
            airlineId,
            flightNo,
            OrderStatusEnum.Created
        );

        // raise event for order created
        const order = new Order(
            baggageId,
            srcAirportId,
            dstAirportId,
            airlineId,
            flightNo,
            OrderStatusEnum.Created
        );
        const orderEventData = {
            orderId,
            ...order,
        };
        const orderEventBuffer = Buffer.from(JSON.stringify(orderEventData));
        ctx.stub.setEvent("OrderCreated", orderEventBuffer);
    }

    @Transaction(true)
    public async claimDelivery(ctx: Context, orderId: string, src: string, dst: string) {
        const orderService = new OrderService(ctx)
        let order = await orderService.get(orderId)
        await orderService.updatesrc(orderId, src)
        await orderService.updatedst(orderId, dst)
        switch (order.status) {
            case (OrderStatusEnum.Created):
                await orderService.updatestatus(orderId, OrderStatusEnum.ClaimedDeliveryToSrcAirport)
                break;
            case OrderStatusEnum.ConfirmedDeliveryTosrcAirport:
                await orderService.updatestatus(orderId, OrderStatusEnum.ClaimedDeliveryToAirline)
                break;
            case OrderStatusEnum.ConfirmedDeliveryToDstAirport:
                await orderService.updatestatus(orderId, OrderStatusEnum.ClaimedDeliveryToEndpoint)
                break;
        }
    }

    @Transaction(true)
    public async confirmDelivery(ctx: Context, orderId: string) {
        const orderService = new OrderService(ctx)
        let order = await orderService.get(orderId)
        switch (order.status) {
            case (OrderStatusEnum.ClaimedDeliveryToSrcAirport):
                await orderService.updatestatus(orderId, OrderStatusEnum.ConfirmedDeliveryTosrcAirport)
                break;
            case OrderStatusEnum.ClaimedDeliveryToAirline:
                await orderService.updatestatus(orderId, OrderStatusEnum.ConfirmedDeliveryToAirline)
                break;
            case OrderStatusEnum.ClaimedDeliveryToDstAirport:
                await orderService.updatestatus(orderId, OrderStatusEnum.ConfirmedDeliveryToDstAirport)
                break;
            case OrderStatusEnum.ClaimedDeliveryToEndpoint:
                await orderService.updatestatus(orderId, OrderStatusEnum.ConfirmedDeliveryToEndpoint)
                break;
        }

    }
}
