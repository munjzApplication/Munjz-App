export const fetchAndCategorizePayments = async (models) => {
    // Aggregation pipeline to group payments by status
    const aggregationPipeline = [
      {
        $group: {
          _id: '$paymentStatus', // Group by payment status (success/pending)
          payments: { $push: '$$ROOT' }, // Include the full document in the grouped result
        },
      },
    ];
  
    // Perform aggregation for each model
    const aggregatedResults = await Promise.all(
      models.map(({ model }) => model.aggregate(aggregationPipeline))
    );
  
    // Initialize arrays to hold categorized payments
    const successPayments = [];
    const pendingPayments = [];
  
    // Process results to categorize payments by status
    aggregatedResults.forEach((result) => {
      result.forEach((group) => {
        if (group._id === 'paid') {
          successPayments.push(...group.payments);
        } else if (group._id === 'pending') {
          pendingPayments.push(...group.payments);
        }
      });
    });
  
    return { successPayments, pendingPayments };
  };
  