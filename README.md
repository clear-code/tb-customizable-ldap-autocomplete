# Customizable LDAP AddressBook Auto Complete

Provides (restores) customizability of auto complete items for LDAP addressbook items.

## How to show extra information into autocomplete items?

You can use following extra preferences to customize the format of the autocomplete items.

 * `ldap_2.servers.*.autoComplete.nameFormat`: the format of the name part. `[cn]` by default.
 * `ldap_2.servers.*.autoComplete.addressFormat`: the format of the address part. `{mail}` by default.
 * `ldap_2.servers.*.autoComplete.commentFormat`: the format of the comment part. `[o]` by default.

Autocomplete items will be shown as: `name <address> | comment`.

Note, you have to set `mail.autoComplete.commentColumn` to `2` to see the comment part as a separate column.
Otherwise it will stay hidden.

## How to use multiple LDAP address books parallelly?

Set `ldap_2.autoComplete.directoryServers` to `*` (means "use all LDAP servers") or a comma-separated list of LDAP server keys.