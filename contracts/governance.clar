;; Governance Contract

(define-map proposals
  { proposal-id: uint }
  {
    title: (string-utf8 100),
    description: (string-utf8 500),
    proposer: principal,
    votes-for: uint,
    votes-against: uint,
    status: (string-ascii 10)
  }
)

(define-map votes
  { proposal-id: uint, voter: principal }
  { vote: bool }
)

(define-data-var last-proposal-id uint u0)

(define-constant err-already-voted (err u100))
(define-constant err-proposal-not-active (err u101))

(define-public (create-proposal (title (string-utf8 100)) (description (string-utf8 500)))
  (let
    ((new-id (+ (var-get last-proposal-id) u1)))
    (map-set proposals
      { proposal-id: new-id }
      {
        title: title,
        description: description,
        proposer: tx-sender,
        votes-for: u0,
        votes-against: u0,
        status: "active"
      }
    )
    (var-set last-proposal-id new-id)
    (ok new-id)
  )
)

(define-public (vote (proposal-id uint) (vote-for bool))
  (let
    ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-proposal-not-active)))
    (asserts! (is-eq (get status proposal) "active") err-proposal-not-active)
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)
    (map-set votes { proposal-id: proposal-id, voter: tx-sender } { vote: vote-for })
    (if vote-for
      (map-set proposals { proposal-id: proposal-id }
        (merge proposal { votes-for: (+ (get votes-for proposal) u1) }))
      (map-set proposals { proposal-id: proposal-id }
        (merge proposal { votes-against: (+ (get votes-against proposal) u1) }))
    )
    (ok true)
  )
)

(define-public (close-proposal (proposal-id uint))
  (let
    ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-proposal-not-active)))
    (asserts! (is-eq (get status proposal) "active") err-proposal-not-active)
    (map-set proposals { proposal-id: proposal-id }
      (merge proposal
        {
          status: (if (> (get votes-for proposal) (get votes-against proposal))
                    "passed"
                    "rejected")
        }
      )
    )
    (ok true)
  )
)

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

