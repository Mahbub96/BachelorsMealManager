bazarData.push({
  userId: mahbub._id,
  date: dateString,
  items: selectedItems,
  totalAmount,
  description: `Weekly grocery shopping - ${dateString}`,
  receiptImage: null,
  status: i < 2 ? "pending" : "approved", // Recent entries pending
  approvedBy: i < 2 ? null : null, // Set to null for now
  approvedAt: i < 2 ? null : new Date(date.getTime() + 3 * 60 * 60 * 1000),
  notes: i % 3 === 0 ? "Good quality items purchased" : "",
  createdAt: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
  updatedAt: new Date(date.getTime() + 12 * 60 * 60 * 1000), // 12 PM
});
