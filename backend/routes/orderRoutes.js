import express from 'express';
import {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  confirmCODPayment,
  uploadEFTProof,
  verifyEFTProof,
  sendPaymentConfirmation,
  exportOrderReceipt,
  exportOrdersCSV,
  exportPaidOrdersCSV,
  cancelOrder,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createOrder).get(protect, admin, getOrders);
router.route('/export/csv').get(protect, admin, exportOrdersCSV);
router.route('/export/paid-csv').get(protect, admin, exportPaidOrdersCSV);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/cod-confirm').put(protect, admin, confirmCODPayment);
router.route('/:id/eft-proof').put(protect, uploadEFTProof);
router.route('/:id/eft-verify').put(protect, admin, verifyEFTProof);
router.route('/:id/send-confirmation').post(protect, admin, sendPaymentConfirmation);
router.route('/:id/export').get(protect, admin, exportOrderReceipt);

export default router;
