/**
 * WrenchIQ — Customer Routes
 *
 * GET /api/customers/lookup?phone=  — Find customer by phone number
 *                                     Returns customer + vehicles + recent ROs
 */

import { Router } from 'express';
import { customers, vehicles, repairOrders } from '../../src/data/demoData.js';

const router = Router();

/** Normalize phone to digits only for fuzzy matching */
function digitsOnly(str) {
  return (str || '').replace(/\D/g, '');
}

// ── GET /lookup?phone= ────────────────────────────────────────────────────────
router.get('/lookup', (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: 'phone query param required' });
  }

  const needle = digitsOnly(phone);
  if (needle.length < 7) {
    return res.status(400).json({ error: 'phone must be at least 7 digits' });
  }

  // Match last 10 digits to handle country-code variants
  const tail = needle.slice(-10);
  const customer = customers.find(c => digitsOnly(c.phone).slice(-10) === tail);

  if (!customer) {
    return res.status(404).json({ found: false, message: 'No customer found for that phone number' });
  }

  const customerVehicles = vehicles.filter(v => customer.vehicleIds.includes(v.id));

  const customerROs = repairOrders
    .filter(ro => ro.customerId === customer.id)
    .sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn))
    .slice(0, 5)
    .map(ro => {
      const vehicle = customerVehicles.find(v => v.id === ro.vehicleId);
      return {
        id: ro.id,
        status: ro.status,
        kanbanStatus: ro.kanbanStatus,
        dateIn: ro.dateIn,
        serviceType: ro.serviceType,
        customerConcern: ro.customerConcern,
        totalEstimate: ro.totalEstimate,
        aiInsights: ro.aiInsights || [],
        vehicle: vehicle ? {
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          mileage: vehicle.mileage,
          licensePlate: vehicle.licensePlate,
        } : null,
      };
    });

  res.json({
    found: true,
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email,
      since: customer.since,
      visits: customer.visits,
      ltv: customer.ltv,
      loyaltyTier: customer.loyaltyTier,
      rating: customer.rating,
      notes: customer.notes,
    },
    vehicles: customerVehicles.map(v => ({
      id: v.id,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      mileage: v.mileage,
      licensePlate: v.licensePlate,
      nextServiceType: v.nextServiceType,
      nextServiceMiles: v.nextServiceMiles,
    })),
    recentROs: customerROs,
  });
});

export default router;
