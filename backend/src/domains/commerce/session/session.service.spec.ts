import { SessionService } from '@/domains/commerce/session/session.service';

describe('SessionService paid booking fulfillment', () => {
  const createService = (sessionModel: Record<string, any>) => new SessionService(
    sessionModel as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { deletePattern: jest.fn().mockResolvedValue(undefined) } as any,
    {} as any,
  );

  it('confirms only the booking reserved for the paid order and preserves its slot', async () => {
    const heldSlot = {
      id: 'slot_1',
      isAvailable: false,
      bookedBy: { toString: () => 'buyer_1' },
    };
    const booking: any = {
      id: 'booking_1',
      userId: { toString: () => 'buyer_1' },
      status: 'awaiting_payment',
      sourceOrderId: 'order_1',
      slotId: 'slot_1',
      amountPaid: 25,
    };
    const sessionDoc: any = {
      id: 'session_1',
      creatorId: { toString: () => 'creator_1' },
      bookings: [booking],
      getSlot: jest.fn().mockReturnValue(heldSlot),
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const sessionModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(sessionDoc) }),
    };
    const service = createService(sessionModel);

    await expect(service.confirmPaidBookingForOrder({
      _id: 'order_1',
      buyerId: { toString: () => 'buyer_1' },
      amountDT: 20,
    })).resolves.toEqual({ bookingId: 'booking_1', sessionId: 'session_1' });

    expect(booking.status).toBe('confirmed');
    expect(booking.meetStatus).toBe('pending');
    expect(booking.amountPaid).toBe(20);
    expect(heldSlot.isAvailable).toBe(false);
    expect(sessionDoc.save).toHaveBeenCalledTimes(1);
  });

  it('releases only an awaiting payment hold and restores its slot', async () => {
    const booking: any = {
      id: 'booking_1',
      userId: { toString: () => 'buyer_1' },
      status: 'awaiting_payment',
      sourceOrderId: 'order_1',
      slotId: 'slot_1',
    };
    const sessionDoc: any = {
      creatorId: { toString: () => 'creator_1' },
      bookings: [booking],
      getSlot: jest.fn().mockReturnValue({ id: 'slot_1', isAvailable: false, bookedBy: booking.userId }),
      cancelSlot: jest.fn().mockReturnValue(true),
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({ findOne: jest.fn().mockResolvedValue(sessionDoc) });

    await service.releasePaidBookingIntent('order_1');

    expect(booking.status).toBe('cancelled');
    expect(sessionDoc.cancelSlot).toHaveBeenCalledWith('slot_1');
    expect(sessionDoc.save).toHaveBeenCalledTimes(1);
  });

  it('returns each created session publication status separately from its scheduling status', async () => {
    const creatorId = '507f1f77bcf86cd799439011';
    const createdSessions = [
      {
        _id: { toString: () => '507f1f77bcf86cd799439012' },
        id: 'published-session',
        title: 'Published session',
        description: 'Description',
        duration: 60,
        isActive: true,
        bookings: [],
        createdAt: new Date(),
      },
      {
        _id: { toString: () => '507f1f77bcf86cd799439013' },
        id: 'draft-session',
        title: 'Draft session',
        description: 'Description',
        duration: 60,
        isActive: false,
        bookings: [],
        createdAt: new Date(),
      },
    ];
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(createdSessions),
    };
    const service = createService({ find: jest.fn().mockReturnValue(query) });

    const result = await service.getSessionsByUser(creatorId, 1, 10, 'created');

    expect(result.data.sessions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'published-session', isActive: true }),
      expect.objectContaining({ id: 'draft-session', isActive: false }),
    ]));
  });

  it('does not expose available slots for a deactivated session', async () => {
    const service = createService({
      findOne: jest.fn().mockResolvedValue({ isActive: false }),
    });

    await expect(service.getAvailableSlots('session-1')).rejects.toThrow('Session non trouvée');
  });
});
