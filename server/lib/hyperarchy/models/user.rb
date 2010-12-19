class User < Monarch::Model::Record
  column :first_name, :string
  column :last_name, :string
  column :email_address, :string
  column :encrypted_password, :string
  column :admin, :boolean
  column :dismissed_welcome_blurb, :boolean, :default => false
  column :dismissed_welcome_guide, :boolean, :default => false

  def self.encrypt_password(unencrypted_password)
    BCrypt::Password.create(unencrypted_password).to_s
  end

  has_many :memberships
  relates_to_many :organizations do
    memberships.join_through(Organization)
  end

  relates_to_many :ssl_organizations do
    organizations.where(:use_ssl => true)
  end

  relates_to_many :elections do
    Election.table
  end

  relates_to_many :candidates do
    Candidate.table
  end


  def can_update_or_destroy?
    current_user.admin? || current_user == self
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def update_whitelist
    list = [:first_name, :last_name, :email_address]
    list.push(:admin) if current_user.admin?
    list
  end

  def organization_ids
    memberships.map(&:organization_id)
  end

  def password=(unencrypted_password)
    return nil if unencrypted_password.blank?
    self.encrypted_password = self.class.encrypt_password(unencrypted_password)
  end

  def password
    return nil if encrypted_password.blank?
    BCrypt::Password.new(encrypted_password)
  end

  def full_name
    "#{first_name} #{last_name}"
  end

  def validate
    validation_error(:first_name, "You must enter a first name.") if first_name.blank?
    validation_error(:last_name, "You must enter a last name.") if last_name.blank?
    validation_error(:email_address, "You must enter an email address.") if email_address.blank?
    validation_error(:encrypted_password, "You must enter a password.") if encrypted_password.blank?
  end

  def last_visited_organization
    memberships.order_by(Membership[:last_visited].desc).first.organization
  end

  def may_need_ssl?
    !ssl_organizations.empty?
  end

  def ssl_elections
    if admin?
      Organization.where(:use_ssl => true).join_through(Election)
    else
      ssl_organizations.join_through(Election)
    end
  end

  def ssl_election_ids
    ssl_elections.project(:id).all.map(&:id)
  end
end
