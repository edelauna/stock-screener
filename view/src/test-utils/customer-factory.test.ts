import { Customer } from "../hooks/billing/use-customer-hook/use-customer";
import { NestedPartial } from "./identity-factory.test";

export const createCustomer = (overrides: NestedPartial<Customer> = {}): Customer => {
  const defaultCustomer: Customer = {
    oid: 'default-oid',
    customer: {
      id: 'default-customer-id',
      object: 'customer',
      metadata: {
        oid: 'default-metadata-oid',
      },
      subscriptions: {
        data: [
          {
            items: {
              data: [
                {
                  plan: {
                    id: 'default-plan-id',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  };

  return {
    ...defaultCustomer,
    ...overrides,
    customer: {
      ...defaultCustomer.customer,
      ...overrides.customer,
      metadata: {
        ...defaultCustomer.customer.metadata,
        ...overrides.customer?.metadata
      },
      subscriptions: {
        ...defaultCustomer.customer.subscriptions,
        ...overrides.customer?.subscriptions
      }
    },
  } as Customer;
};

describe('createCustomer', () => {
  it('should create a customer with default values', () => {
    const customer = createCustomer();

    expect(customer).toEqual({
      oid: 'default-oid',
      customer: {
        id: 'default-customer-id',
        object: 'customer',
        metadata: {
          oid: 'default-metadata-oid',
        },
        subscriptions: {
          data: [
            {
              items: {
                data: [
                  {
                    plan: {
                      id: 'default-plan-id',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });

  it('should create a customer with custom values', () => {
    const customCustomer = createCustomer({
      oid: 'custom-oid',
      customer: {
        id: 'custom-customer-id',
        metadata: {
          oid: 'custom-metadata-oid',
        },
        subscriptions: {
          data: [
            {
              items: {
                data: [
                  {
                    plan: {
                      id: 'custom-plan-id',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    expect(customCustomer).toEqual({
      oid: 'custom-oid',
      customer: {
        id: 'custom-customer-id',
        object: 'customer',
        metadata: {
          oid: 'custom-metadata-oid',
        },
        subscriptions: {
          data: [
            {
              items: {
                data: [
                  {
                    plan: {
                      id: 'custom-plan-id',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });

  it('should use default values for unspecified fields', () => {

    const partialCustomer = createCustomer({
      oid: 'partial-oid',
      customer: {
        id: 'partial-customer-id',
      },
    });

    expect(partialCustomer).toEqual({
      oid: 'partial-oid',
      customer: {
        id: 'partial-customer-id',
        object: 'customer',
        metadata: {
          oid: 'default-metadata-oid',
        },
        subscriptions: {
          data: [
            {
              items: {
                data: [
                  {

                    plan: {
                      id: 'default-plan-id',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });
});
