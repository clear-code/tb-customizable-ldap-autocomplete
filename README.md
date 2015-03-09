# Customizable LDAP AddressBook Auto Complete

This addon provides three features:

 1. This provides (restores) customizability of auto complete items for LDAP addressbook items.
    The customizability is removed by the commit http://hg.mozilla.org/releases/comm-esr31/rev/0ba38b41f77f between Thunderbird 24 and 31, by [the bug 452232 – Move LDAP autocomplete over to toolkit interfaces](https://bugzilla.mozilla.org/show_bug.cgi?id=452232).
 2. This provides parallel search with multiple LDAP addressbooks.
    (Inspired from [the Multi LDAP addon](https://addons.mozilla.org/thunderbird/addon/multi-ldap/))
 3. Photo preview for autocomplete items and addressbook sidebar items.

## How to show extra information into autocomplete items?

You can use following extra preferences to customize the format of the autocomplete items.

 * `ldap_2.servers.*.autoComplete.nameFormat`: the format of the name part. `[cn]` by default.
 * `ldap_2.servers.*.autoComplete.addressFormat`: the format of the address part. `{mail}` by default.
 * `ldap_2.servers.*.autoComplete.commentFormat`: the format of the comment part. `[o]` by default.

Autocomplete items will be shown as: `name <address> | comment`.

Note, you have to set `mail.autoComplete.commentColumn` to `2` to see the comment part as a separate column.
Otherwise it will stay hidden.

## How to use multiple LDAP address books parallelly?

Set `extensions.customizable-ldap-autocomplete@clear-code.com.directoryServers` to `*` (means "use all LDAP servers") or a comma-separated list of LDAP server keys like `ldap_2.servers.foo,ldap_2.servers.bar,ldap_2.servers.baz`.

## How to show photo preview?

If the addressbook card for the selected autocomplete item (or the addressbook sidebar item) has its owne photo, it is shown as a popup near the item automatically.

For LDAP addressbooks, photo stored in `thumbnailPhoto` attribute is used when another addon [LDAP Contact Photo](https://addons.mozilla.org/thunderbird/addon/ldap-contact-photo/) is installed together.
