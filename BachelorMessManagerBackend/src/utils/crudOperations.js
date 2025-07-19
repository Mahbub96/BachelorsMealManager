/**
 * Uniform CRUD Operations Handler
 * Provides standardized CRUD operations for consistent data manipulation
 */

const logger = require('./logger');
const { getRequestContext } = require('./responseHandler');

/**
 * Create a new resource
 * @param {Object} Model - Mongoose model
 * @param {Object} data - Data to create
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created resource
 */
const createResource = async (Model, data, options = {}) => {
  const context = options.context || {};
  
  try {
    logger.info(`Creating ${Model.modelName}`, {
      data: options.logData ? data : '***',
      userId: context.userId,
      requestId: context.requestId,
    });

    const resource = await Model.create(data);
    
    logger.info(`${Model.modelName} created successfully`, {
      resourceId: resource._id,
      userId: context.userId,
      requestId: context.requestId,
    });

    return resource;
  } catch (error) {
    logger.error(`Error creating ${Model.modelName}`, {
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Find resources with pagination and filtering
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Paginated results
 */
const findResources = async (Model, filter = {}, options = {}) => {
  const context = options.context || {};
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    select = null,
    populate = null,
  } = options;

  try {
    logger.info(`Finding ${Model.modelName}s`, {
      filter: options.logFilter ? filter : '***',
      page,
      limit,
      userId: context.userId,
      requestId: context.requestId,
    });

    const skip = (page - 1) * limit;
    
    // Build query
    let query = Model.find(filter);
    
    // Apply sorting
    if (sort) {
      query = query.sort(sort);
    }
    
    // Apply pagination
    query = query.skip(skip).limit(limit);
    
    // Apply field selection
    if (select) {
      query = query.select(select);
    }
    
    // Apply population
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }

    // Execute query
    const [resources, total] = await Promise.all([
      query.exec(),
      Model.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    logger.info(`${Model.modelName}s found successfully`, {
      count: resources.length,
      total,
      page,
      totalPages,
      userId: context.userId,
      requestId: context.requestId,
    });

    return {
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  } catch (error) {
    logger.error(`Error finding ${Model.modelName}s`, {
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Find a single resource by ID
 * @param {Object} Model - Mongoose model
 * @param {string} id - Resource ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Found resource
 */
const findResourceById = async (Model, id, options = {}) => {
  const context = options.context || {};
  const { select = null, populate = null } = options;

  try {
    logger.info(`Finding ${Model.modelName} by ID`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    let query = Model.findById(id);
    
    // Apply field selection
    if (select) {
      query = query.select(select);
    }
    
    // Apply population
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }

    const resource = await query.exec();

    if (!resource) {
      logger.warn(`${Model.modelName} not found`, {
        resourceId: id,
        userId: context.userId,
        requestId: context.requestId,
      });
      return null;
    }

    logger.info(`${Model.modelName} found successfully`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    return resource;
  } catch (error) {
    logger.error(`Error finding ${Model.modelName} by ID`, {
      resourceId: id,
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Update a resource by ID
 * @param {Object} Model - Mongoose model
 * @param {string} id - Resource ID
 * @param {Object} updateData - Data to update
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Updated resource
 */
const updateResource = async (Model, id, updateData, options = {}) => {
  const context = options.context || {};
  const { runValidators = true, new: returnNew = true } = options;

  try {
    logger.info(`Updating ${Model.modelName}`, {
      resourceId: id,
      updateData: options.logData ? updateData : '***',
      userId: context.userId,
      requestId: context.requestId,
    });

    const resource = await Model.findByIdAndUpdate(
      id,
      updateData,
      {
        new: returnNew,
        runValidators,
        ...options,
      }
    );

    if (!resource) {
      logger.warn(`${Model.modelName} not found for update`, {
        resourceId: id,
        userId: context.userId,
        requestId: context.requestId,
      });
      return null;
    }

    logger.info(`${Model.modelName} updated successfully`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    return resource;
  } catch (error) {
    logger.error(`Error updating ${Model.modelName}`, {
      resourceId: id,
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Delete a resource by ID
 * @param {Object} Model - Mongoose model
 * @param {string} id - Resource ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Deleted resource
 */
const deleteResource = async (Model, id, options = {}) => {
  const context = options.context || {};

  try {
    logger.info(`Deleting ${Model.modelName}`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    const resource = await Model.findByIdAndDelete(id);

    if (!resource) {
      logger.warn(`${Model.modelName} not found for deletion`, {
        resourceId: id,
        userId: context.userId,
        requestId: context.requestId,
      });
      return null;
    }

    logger.info(`${Model.modelName} deleted successfully`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    return resource;
  } catch (error) {
    logger.error(`Error deleting ${Model.modelName}`, {
      resourceId: id,
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Soft delete a resource by ID (sets deletedAt field)
 * @param {Object} Model - Mongoose model
 * @param {string} id - Resource ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Soft deleted resource
 */
const softDeleteResource = async (Model, id, options = {}) => {
  const context = options.context || {};

  try {
    logger.info(`Soft deleting ${Model.modelName}`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    const resource = await Model.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!resource) {
      logger.warn(`${Model.modelName} not found for soft deletion`, {
        resourceId: id,
        userId: context.userId,
        requestId: context.requestId,
      });
      return null;
    }

    logger.info(`${Model.modelName} soft deleted successfully`, {
      resourceId: id,
      userId: context.userId,
      requestId: context.requestId,
    });

    return resource;
  } catch (error) {
    logger.error(`Error soft deleting ${Model.modelName}`, {
      resourceId: id,
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Bulk update resources
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - Filter criteria
 * @param {Object} updateData - Data to update
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Update result
 */
const bulkUpdateResources = async (Model, filter, updateData, options = {}) => {
  const context = options.context || {};

  try {
    logger.info(`Bulk updating ${Model.modelName}s`, {
      filter: options.logFilter ? filter : '***',
      updateData: options.logData ? updateData : '***',
      userId: context.userId,
      requestId: context.requestId,
    });

    const result = await Model.updateMany(filter, updateData, options);

    logger.info(`${Model.modelName}s bulk updated successfully`, {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      userId: context.userId,
      requestId: context.requestId,
    });

    return result;
  } catch (error) {
    logger.error(`Error bulk updating ${Model.modelName}s`, {
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Bulk delete resources
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Delete result
 */
const bulkDeleteResources = async (Model, filter, options = {}) => {
  const context = options.context || {};

  try {
    logger.info(`Bulk deleting ${Model.modelName}s`, {
      filter: options.logFilter ? filter : '***',
      userId: context.userId,
      requestId: context.requestId,
    });

    const result = await Model.deleteMany(filter);

    logger.info(`${Model.modelName}s bulk deleted successfully`, {
      deletedCount: result.deletedCount,
      userId: context.userId,
      requestId: context.requestId,
    });

    return result;
  } catch (error) {
    logger.error(`Error bulk deleting ${Model.modelName}s`, {
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Count resources
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Additional options
 * @returns {Promise<number>} Count result
 */
const countResources = async (Model, filter = {}, options = {}) => {
  const context = options.context || {};

  try {
    logger.info(`Counting ${Model.modelName}s`, {
      filter: options.logFilter ? filter : '***',
      userId: context.userId,
      requestId: context.requestId,
    });

    const count = await Model.countDocuments(filter);

    logger.info(`${Model.modelName}s count completed`, {
      count,
      userId: context.userId,
      requestId: context.requestId,
    });

    return count;
  } catch (error) {
    logger.error(`Error counting ${Model.modelName}s`, {
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Check if resource exists
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} Existence check result
 */
const resourceExists = async (Model, filter, options = {}) => {
  const context = options.context || {};

  try {
    logger.info(`Checking if ${Model.modelName} exists`, {
      filter: options.logFilter ? filter : '***',
      userId: context.userId,
      requestId: context.requestId,
    });

    const exists = await Model.exists(filter);

    logger.info(`${Model.modelName} existence check completed`, {
      exists: !!exists,
      userId: context.userId,
      requestId: context.requestId,
    });

    return !!exists;
  } catch (error) {
    logger.error(`Error checking ${Model.modelName} existence`, {
      error: error.message,
      userId: context.userId,
      requestId: context.requestId,
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = {
  createResource,
  findResources,
  findResourceById,
  updateResource,
  deleteResource,
  softDeleteResource,
  bulkUpdateResources,
  bulkDeleteResources,
  countResources,
  resourceExists,
}; 