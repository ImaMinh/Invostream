import { Hash, DollarSign, Building, User } from 'lucide-react';

/**
 * Categorized editable field sections configuration for the invoice detail view.
 */
export const fieldSections = [
  {
    id: 'invoice_info',
    title: 'Invoice & Identification',
    icon: Hash,
    fields: [
      { key: 'invoice_id', label: 'Invoice ID' },
      { key: 'purchase_order', label: 'Purchase Order' },
      { key: 'invoice_date', label: 'Invoice Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'payment_term', label: 'Payment Term' },
      { key: 'country_code', label: 'Country Code' }
    ]
  },
  {
    id: 'financials',
    title: 'Financial Summary',
    icon: DollarSign,
    fields: [
      { key: 'invoice_total', label: 'Invoice Total' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'total_tax', label: 'Total Tax' },
      { key: 'total_discount', label: 'Total Discount' },
      { key: 'amount_due', label: 'Amount Due' },
      { key: 'previous_unpaid_balance', label: 'Previous Unpaid Balance' },
      { key: 'currency', label: 'Currency' }
    ]
  },
  {
    id: 'vendor_info',
    title: 'Vendor / Supplier Details',
    icon: Building,
    fields: [
      { key: 'vendor_name', label: 'Vendor Name' },
      { key: 'vendor_tax_id', label: 'Vendor Tax ID' },
      { key: 'vendor_address', label: 'Vendor Address' },
      { key: 'vendor_address_recipient', label: 'Vendor Recipient' },
      { key: 'kvk_number', label: 'KVK Number' }
    ]
  },
  {
    id: 'customer_info',
    title: 'Customer & Delivery Details',
    icon: User,
    fields: [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_tax_id', label: 'Customer Tax ID' },
      { key: 'customer_address', label: 'Customer Address' },
      { key: 'customer_address_recipient', label: 'Customer Recipient' },
      { key: 'billing_address', label: 'Billing Address' },
      { key: 'shipping_address', label: 'Shipping Address' },
      { key: 'remittance_address', label: 'Remittance Address' },
      { key: 'service_address', label: 'Service Address' }
    ]
  }
];

export const allEditableFields = fieldSections.flatMap(section => section.fields);
