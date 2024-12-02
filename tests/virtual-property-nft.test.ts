import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let nftOwners: { [key: number]: string } = {}
let propertyMetadata: { [key: number]: any } = {}
let lastPropertyId = 0
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

// Mock contract functions
const mint = (sender: string, recipient: string, location: string, size: number, propertyType: string) => {
  if (sender !== contractOwner) {
    return { success: false, error: 100 }
  }
  lastPropertyId++
  nftOwners[lastPropertyId] = recipient
  propertyMetadata[lastPropertyId] = {
    location,
    size,
    property_type: propertyType,
    owner: recipient
  }
  return { success: true, value: lastPropertyId }
}

const transfer = (sender: string, propertyId: number, recipient: string) => {
  if (nftOwners[propertyId] !== sender) {
    return { success: false, error: 100 }
  }
  nftOwners[propertyId] = recipient
  propertyMetadata[propertyId].owner = recipient
  return { success: true }
}

const getPropertyMetadata = (propertyId: number) => {
  return propertyMetadata[propertyId] || null
}

const getOwner = (propertyId: number) => {
  return nftOwners[propertyId] || null
}

describe('VirtualPropertyNFT', () => {
  beforeEach(() => {
    nftOwners = {}
    propertyMetadata = {}
    lastPropertyId = 0
  })
  
  it('allows minting a new virtual property', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const result = mint(contractOwner, wallet1, 'Crypto City, Block 1', 1000, 'commercial')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const metadata = getPropertyMetadata(1)
    expect(metadata).toEqual({
      location: 'Crypto City, Block 1',
      size: 1000,
      property_type: 'commercial',
      owner: wallet1
    })
    
    const owner = getOwner(1)
    expect(owner).toBe(wallet1)
  })
  
  it('allows transferring a virtual property', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    mint(contractOwner, wallet1, 'Crypto City, Block 1', 1000, 'commercial')
    
    const transferResult = transfer(wallet1, 1, wallet2)
    expect(transferResult.success).toBe(true)
    
    const newOwner = getOwner(1)
    expect(newOwner).toBe(wallet2)
    
    const updatedMetadata = getPropertyMetadata(1)
    expect(updatedMetadata.owner).toBe(wallet2)
  })
  
  it('prevents non-owners from transferring property', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    mint(contractOwner, wallet1, 'Crypto City, Block 1', 1000, 'commercial')
    
    const transferResult = transfer(wallet2, 1, wallet2)
    expect(transferResult.success).toBe(false)
    expect(transferResult.error).toBe(100)
    
    const owner = getOwner(1)
    expect(owner).toBe(wallet1)
  })
})

