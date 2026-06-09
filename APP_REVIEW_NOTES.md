# App Store Connect — App Review Notes

Paste the text below into **App Store Connect → your version → App Review Information → Notes**.

---

## Account Deletion (Guideline 5.1.1(v))

Ankaa Design is an internal business application used exclusively by employees of
our company. **User accounts are not self-created inside the app** — there is no
sign-up/registration flow. Accounts are provisioned and managed by a company
administrator through our internal management system.

Because accounts are created and owned by the organization on behalf of its
employees, in-app self-service account deletion is not applicable (per the
enterprise/organization exception in Guideline 5.1.1(v)).

To delete an account or associated personal data, a user contacts the company
administrator, or emails **kennedy.ankaa@gmail.com**. This is also described in
our Privacy Policy: https://ankaadesign.com.br/politica-de-privacidade

## Demo / Review Credentials

A working test account is provided in the "Sign-In Information" fields.
The app requires sign-in to function. The reviewer can use those credentials to
access all features.

## Network Note

The app primarily uses our secure cloud API over HTTPS
(https://api.ankaadesign.com.br). When used inside our office on the local
network without internet access, it can fall back to a local server over the LAN.
This local fallback is only reachable inside our private network and is not
required to review the app — the cloud API works for all review testing.
