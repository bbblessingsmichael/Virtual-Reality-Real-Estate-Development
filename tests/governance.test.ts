import { describe, it, expect, beforeEach } from 'vitest'

// Mock blockchain state
let proposals: { [key: number]: any } = {}
let votes: { [key: string]: boolean } = {}
let lastProposalId = 0

// Mock contract functions
const createProposal = (sender: string, title: string, description: string) => {
  lastProposalId++
  proposals[lastProposalId] = {
    title,
    description,
    proposer: sender,
    votes_for: 0,
    votes_against: 0,
    status: 'active'
  }
  return { success: true, value: lastProposalId }
}

const vote = (sender: string, proposalId: number, voteFor: boolean) => {
  const proposal = proposals[proposalId]
  if (!proposal || proposal.status !== 'active') {
    return { success: false, error: 101 }
  }
  const voteKey = `${proposalId}:${sender}`
  if (votes[voteKey] !== undefined) {
    return { success: false, error: 100 }
  }
  votes[voteKey] = voteFor
  if (voteFor) {
    proposal.votes_for++
  } else {
    proposal.votes_against++
  }
  return { success: true }
}

const closeProposal = (proposalId: number) => {
  const proposal = proposals[proposalId]
  if (!proposal || proposal.status !== 'active') {
    return { success: false, error: 101 }
  }
  proposal.status = proposal.votes_for > proposal.votes_against ? 'passed' : 'rejected'
  return { success: true }
}

const getProposal = (proposalId: number) => {
  return proposals[proposalId] || null
}

const getVote = (proposalId: number, voter: string) => {
  return votes[`${proposalId}:${voter}`]
}

describe('Governance', () => {
  beforeEach(() => {
    proposals = {}
    votes = {}
    lastProposalId = 0
  })
  
  it('allows creating a proposal', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    
    const result = createProposal(wallet1, 'New Zoning Rule', 'Propose a new zoning rule for commercial areas')
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const proposal = getProposal(1)
    expect(proposal).toEqual({
      title: 'New Zoning Rule',
      description: 'Propose a new zoning rule for commercial areas',
      proposer: wallet1,
      votes_for: 0,
      votes_against: 0,
      status: 'active'
    })
  })
  
  it('allows voting on a proposal', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createProposal(wallet1, 'New Zoning Rule', 'Propose a new zoning rule for commercial areas')
    
    const voteResult = vote(wallet2, 1, true)
    expect(voteResult.success).toBe(true)
    
    const proposal = getProposal(1)
    expect(proposal.votes_for).toBe(1)
    expect(proposal.votes_against).toBe(0)
    
    const voterChoice = getVote(1, wallet2)
    expect(voterChoice).toBe(true)
  })
  
  it('prevents double voting', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createProposal(wallet1, 'New Zoning Rule', 'Propose a new zoning rule for commercial areas')
    vote(wallet2, 1, true)
    
    const secondVoteResult = vote(wallet2, 1, false)
    expect(secondVoteResult.success).toBe(false)
    expect(secondVoteResult.error).toBe(100)
    
    const proposal = getProposal(1)
    expect(proposal.votes_for).toBe(1)
    expect(proposal.votes_against).toBe(0)
  })
  
  it('allows closing a proposal', () => {
    const wallet1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
    const wallet2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
    
    createProposal(wallet1, 'New Zoning Rule', 'Propose a new zoning rule for commercial areas')
    vote(wallet1, 1, true)
    vote(wallet2, 1, false)
    
    const closeResult = closeProposal(1)
    expect(closeResult.success).toBe(true)
    
    const proposal = getProposal(1)
    expect(proposal.status).toBe('passed')
  })
})

