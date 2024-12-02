;; Virtual Property NFT Contract

(define-non-fungible-token virtual-property uint)

(define-data-var last-property-id uint u0)

(define-map property-metadata
  { property-id: uint }
  {
    location: (string-utf8 100),
    size: uint,
    property-type: (string-ascii 20),
    owner: principal
  }
)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))

(define-public (mint (recipient principal) (location (string-utf8 100)) (size uint) (property-type (string-ascii 20)))
  (let
    ((new-id (+ (var-get last-property-id) u1)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (try! (nft-mint? virtual-property new-id recipient))
    (map-set property-metadata
      { property-id: new-id }
      {
        location: location,
        size: size,
        property-type: property-type,
        owner: recipient
      }
    )
    (var-set last-property-id new-id)
    (ok new-id)
  )
)

(define-public (transfer (property-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) err-owner-only)
    (try! (nft-transfer? virtual-property property-id sender recipient))
    (map-set property-metadata
      { property-id: property-id }
      (merge (unwrap! (map-get? property-metadata { property-id: property-id }) err-not-found)
             { owner: recipient })
    )
    (ok true)
  )
)

(define-read-only (get-property-metadata (property-id uint))
  (map-get? property-metadata { property-id: property-id })
)

(define-read-only (get-owner (property-id uint))
  (ok (nft-get-owner? virtual-property property-id))
)

